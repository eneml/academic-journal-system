package com.eneml.ajs.integration.internal.application;

import com.eneml.ajs.integration.api.DepositStatus;
import com.eneml.ajs.integration.api.DepositSubject;
import com.eneml.ajs.integration.api.DepositSummary;
import com.eneml.ajs.integration.api.DepositTarget;
import com.eneml.ajs.integration.internal.domain.DepositRecord;
import com.eneml.ajs.integration.internal.domain.OrcidCredentials;
import com.eneml.ajs.integration.internal.persistence.DepositRecordRepository;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.submission.api.SubmissionAuthorSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Application service for outbound deposits. Has two responsibilities:
 * <ol>
 *   <li>{@code enqueue(...)} — create a PENDING {@link DepositRecord} when a
 *       publication crosses a state worth telling external systems about.
 *   <li>{@code dispatchPending(...)} — pick up PENDING records and hand them
 *       to the appropriate target client (CrossRef / ORCID).
 * </ol>
 * The scheduler ({@link DepositDispatchJob}) drives {@link #dispatchPending}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DepositService {

    private final DepositRecordRepository repository;
    private final IntegrationProperties properties;
    private final CrossRefDepositXmlGenerator crossRefGenerator;
    private final CrossRefClient crossRefClient;
    private final OrcidWorkXmlGenerator orcidWorkGenerator;
    private final OrcidClient orcidClient;
    private final OrcidAuthService orcidAuthService;
    private final PublicationLookup publicationLookup;
    private final SubmissionLookup submissionLookup;
    private final UserDirectoryService userDirectory;

    @Transactional
    public DepositRecord enqueue(DepositTarget target, DepositSubject subject, Long subjectId) {
        return enqueue(target, subject, subjectId, null);
    }

    @Transactional
    public DepositRecord enqueue(DepositTarget target,
                                 DepositSubject subject,
                                 Long subjectId,
                                 Long actorUserId) {
        DepositRecord r = new DepositRecord();
        r.setTarget(target);
        r.setSubjectType(subject);
        r.setSubjectId(subjectId);
        r.setActorUserId(actorUserId);
        r.setStatus(DepositStatus.PENDING);
        DepositRecord saved = repository.save(r);
        log.info("enqueued {} deposit for {} {} (actor={}) as record {}",
                target, subject, subjectId, actorUserId, saved.getId());
        return saved;
    }

    public List<DepositSummary> historyFor(DepositSubject subject, Long subjectId) {
        return repository.findBySubjectTypeAndSubjectIdOrderByCreatedAtDesc(subject, subjectId)
                .stream().map(DepositService::toSummary).toList();
    }

    /**
     * Process up to {@code batchSize} PENDING records. Each record is
     * processed in its own transaction-ish boundary (via the per-record
     * persistence calls below) so a single bad record doesn't block the
     * whole batch.
     */
    @Transactional
    public int dispatchPending(int batchSize) {
        List<DepositRecord> pending = repository.findByStatusOrderByCreatedAtAsc(
                DepositStatus.PENDING, PageRequest.of(0, batchSize));
        int handled = 0;
        for (DepositRecord r : pending) {
            try {
                process(r);
            } catch (RuntimeException e) {
                log.warn("deposit {} failed: {}", r.getId(), e.getMessage());
                r.markFailed(e.getMessage());
            }
            handled++;
        }
        return handled;
    }

    private void process(DepositRecord r) {
        switch (r.getTarget()) {
            case CROSSREF -> processCrossRef(r);
            case ORCID    -> processOrcid(r);
        }
    }

    private void processCrossRef(DepositRecord r) {
        if (!properties.crossref().enabled()) {
            r.markSkipped("CrossRef integration disabled");
            return;
        }
        if (r.getSubjectType() != DepositSubject.PUBLICATION) {
            r.markSkipped("CrossRef deposit only supported for PUBLICATION subjects");
            return;
        }
        String xml = crossRefGenerator.generate(r.getSubjectId());
        r.setPayload(xml);
        CrossRefClient.Result result = crossRefClient.submit(xml);
        r.markSent(result.responseBody());
        if (result.accepted()) {
            r.markAccepted(result.batchId());
        } else {
            r.markFailed(result.errorMessage());
        }
    }

    private void processOrcid(DepositRecord r) {
        if (!properties.orcid().enabled()) {
            r.markSkipped("ORCID integration disabled");
            return;
        }
        if (r.getSubjectType() != DepositSubject.PUBLICATION) {
            r.markSkipped("ORCID push only supported for PUBLICATION subjects");
            return;
        }
        Long actorUserId = r.getActorUserId();
        if (actorUserId == null) {
            // Legacy / manually-enqueued ORCID deposit without an actor —
            // fall back to "first linked author" so manual triggers still work.
            Optional<Long> first = firstLinkedAuthor(r.getSubjectId());
            if (first.isEmpty()) {
                r.markSkipped("No ORCID-linked author with stored OAuth credentials");
                return;
            }
            actorUserId = first.get();
        }
        Optional<OrcidCredentials> creds = orcidAuthService.findFor(actorUserId);
        if (creds.isEmpty()) {
            r.markSkipped("No ORCID credentials on file for user " + actorUserId);
            return;
        }
        // Rotate the access token if it's about to expire (or already has).
        Optional<OrcidCredentials> refreshed = orcidAuthService.refreshIfNeeded(creds.get());
        if (refreshed.isEmpty()) {
            r.markSkipped("ORCID token expired and refresh failed for user " + actorUserId);
            return;
        }
        String xml = orcidWorkGenerator.generate(r.getSubjectId());
        r.setPayload(xml);
        OrcidClient.Result result = orcidClient.pushWork(refreshed.get(), xml);
        r.markSent(result.responseBody());
        if (result.accepted()) {
            r.markAccepted(result.putCode());
        } else {
            r.markFailed(result.errorMessage());
        }
    }

    /**
     * Resolve all local user ids who appear on the publication's author
     * list AND have stored ORCID credentials. Used by the listener to
     * enqueue one deposit per linked author.
     */
    public List<Long> linkedAuthorsFor(Long publicationId) {
        var pub = publicationLookup.findById(publicationId).orElse(null);
        if (pub == null) return List.of();
        return submissionLookup.authorsOf(pub.submissionId()).stream()
                .filter(a -> a.orcidId() != null && !a.orcidId().isBlank())
                .map(a -> resolveUser(a))
                .filter(java.util.Objects::nonNull)
                .filter(uid -> orcidAuthService.findFor(uid).isPresent())
                .distinct()
                .toList();
    }

    private Long resolveUser(SubmissionAuthorSummary author) {
        if (author.userId() != null) {
            return userDirectory.findById(author.userId()).map(UserSummary::id).orElse(null);
        }
        if (author.email() != null && !author.email().isBlank()) {
            return userDirectory.findByEmail(author.email()).map(UserSummary::id).orElse(null);
        }
        return null;
    }

    private Optional<Long> firstLinkedAuthor(Long publicationId) {
        return linkedAuthorsFor(publicationId).stream().findFirst();
    }

    private static DepositSummary toSummary(DepositRecord e) {
        return new DepositSummary(
                e.getId(),
                e.getTarget(),
                e.getSubjectType(),
                e.getSubjectId(),
                e.getExternalRef(),
                e.getStatus(),
                e.getAttempts(),
                e.getLastAttemptAt(),
                e.getCompletedAt(),
                e.getErrorMessage());
    }
}
