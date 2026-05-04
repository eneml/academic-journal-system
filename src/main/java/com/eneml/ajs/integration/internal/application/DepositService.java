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
        DepositRecord r = new DepositRecord();
        r.setTarget(target);
        r.setSubjectType(subject);
        r.setSubjectId(subjectId);
        r.setStatus(DepositStatus.PENDING);
        DepositRecord saved = repository.save(r);
        log.info("enqueued {} deposit for {} {} as record {}",
                target, subject, subjectId, saved.getId());
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
        Optional<OrcidCredentials> creds = findCredentialsForPublication(r.getSubjectId());
        if (creds.isEmpty()) {
            r.markSkipped("No ORCID-linked author with stored OAuth credentials");
            return;
        }
        String xml = orcidWorkGenerator.generate(r.getSubjectId());
        r.setPayload(xml);
        OrcidClient.Result result = orcidClient.pushWork(creds.get(), xml);
        r.markSent(result.responseBody());
        if (result.accepted()) {
            r.markAccepted(result.putCode());
        } else {
            r.markFailed(result.errorMessage());
        }
    }

    /**
     * For each contributor on the publication, look up their local user
     * record by ORCID iD and check whether we hold OAuth credentials.
     * Returns the first match — when multiple authors are linked we send
     * separate deposit_record rows per author (a future enhancement).
     */
    private Optional<OrcidCredentials> findCredentialsForPublication(Long publicationId) {
        var pub = publicationLookup.findById(publicationId).orElse(null);
        if (pub == null) return Optional.empty();
        for (SubmissionAuthorSummary author : submissionLookup.authorsOf(pub.submissionId())) {
            if (author.orcidId() == null || author.orcidId().isBlank()) continue;
            UserSummary user = author.userId() == null
                    ? userDirectory.findByEmail(author.email() == null ? "" : author.email()).orElse(null)
                    : userDirectory.findById(author.userId()).orElse(null);
            if (user == null) continue;
            Optional<OrcidCredentials> c = orcidAuthService.findFor(user.id());
            if (c.isPresent()) return c;
        }
        return Optional.empty();
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
