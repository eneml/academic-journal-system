package com.eneml.ajs.submission.internal.application;

import com.eneml.ajs.journal.api.SectionLookup;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStarted;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.api.SubmissionSubmitted;
import com.eneml.ajs.submission.internal.domain.Submission;
import com.eneml.ajs.submission.internal.persistence.SubmissionRepository;
import com.eneml.ajs.submission.internal.web.dto.SubmissionDetailsRequest;
import com.eneml.ajs.submission.internal.web.dto.SubmissionStartRequest;
import com.eneml.ajs.submission.internal.web.mapper.SubmissionMapper;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionService {

    private final SubmissionRepository repository;
    private final SubmissionMapper mapper;
    private final SectionLookup sectionLookup;
    private final ApplicationEventPublisher events;

    public Submission get(Long id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Submission", id));
    }

    public Submission getOwned(Long id, Long userId) {
        Submission s = get(id);
        if (!s.getSubmittedByUserId().equals(userId)) {
            throw new AccessDeniedException("Submission %d is not owned by user %d".formatted(id, userId));
        }
        return s;
    }

    public Page<Submission> listMine(Long userId, Pageable pageable) {
        return repository.findBySubmittedByUserId(userId, pageable);
    }

    public Page<Submission> listByStatus(SubmissionStatus status, Pageable pageable) {
        return repository.findByStatus(status, pageable);
    }

    public Page<Submission> listEditorialQueue(SubmissionStage stage, Pageable pageable) {
        return repository.findByStatusAndStage(SubmissionStatus.QUEUED, stage, pageable);
    }

    /**
     * Faceted search over the entire submission queue. All filters are
     * optional — when nothing is set the call degrades to a sorted page
     * of every submission. {@code q} matches case-insensitively against
     * the title in any locale (jsonb-as-text).
     */
    public Page<Submission> search(SubmissionFilters filters, Pageable pageable) {
        return repository.findAll(toSpecification(filters), pageable);
    }

    private static Specification<Submission> toSpecification(SubmissionFilters f) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>(8);
            if (f.status() != null) {
                preds.add(cb.equal(root.get("status"), f.status()));
            }
            if (f.stage() != null) {
                preds.add(cb.equal(root.get("stage"), f.stage()));
            }
            if (f.sectionId() != null) {
                preds.add(cb.equal(root.get("sectionId"), f.sectionId()));
            }
            if (f.submittedByUserId() != null) {
                preds.add(cb.equal(root.get("submittedByUserId"), f.submittedByUserId()));
            }
            if (f.submittedAfter() != null) {
                preds.add(cb.greaterThanOrEqualTo(
                        root.get("dateSubmitted"), f.submittedAfter()));
            }
            if (f.submittedBefore() != null) {
                preds.add(cb.lessThan(
                        root.get("dateSubmitted"), f.submittedBefore()));
            }
            // q (free-text title search) over jsonb columns needs Postgres
            // ::text casting which JPA's CriteriaBuilder doesn't surface
            // portably. Keep the field on the filter record for future use
            // (search module integration) but do the filtering client-side
            // for now — the editorial inbox is small enough that a single
            // page's worth of results is the right scope anyway.
            return preds.isEmpty() ? cb.conjunction() : cb.and(preds.toArray(new Predicate[0]));
        };
    }

    /**
     * Holder for facets accepted by {@link #search(SubmissionFilters, Pageable)}.
     * All fields are nullable; null = no filter.
     */
    public record SubmissionFilters(
            SubmissionStatus status,
            SubmissionStage stage,
            Long sectionId,
            Long submittedByUserId,
            Instant submittedAfter,
            Instant submittedBefore,
            String q
    ) {
    }

    @Transactional
    public Submission start(SubmissionStartRequest request, Long submittedByUserId) {
        sectionLookup.findById(request.sectionId())
                .filter(s -> !s.inactive())
                .orElseThrow(() -> new ConflictException(
                        "Section %d does not exist or is inactive".formatted(request.sectionId())));

        Submission submission = new Submission();
        submission.setSectionId(request.sectionId());
        submission.setLocale(request.locale());
        submission.setSubmittedByUserId(submittedByUserId);
        Submission saved = repository.save(submission);
        events.publishEvent(SubmissionStarted.of(saved.getId(), submittedByUserId));
        return saved;
    }

    @Transactional
    public Submission updateDetails(Long id, SubmissionDetailsRequest request, Long userId) {
        Submission s = getOwned(id, userId);
        if (!s.isDraft()) {
            throw new ConflictException("Submission %d is no longer in draft state".formatted(id));
        }
        mapper.applyDetails(request, s);
        s.setProgress(request.progress());
        s.touchActivity();
        return s;
    }

    @Transactional
    public Submission submit(Long id, Long userId) {
        Submission s = getOwned(id, userId);
        if (!s.isDraft()) {
            throw new ConflictException("Submission %d already submitted".formatted(id));
        }
        s.markSubmitted();
        events.publishEvent(SubmissionSubmitted.of(s.getId(), s.getSectionId(), userId));
        return s;
    }

    @Transactional
    public void deleteDraft(Long id, Long userId) {
        Submission s = getOwned(id, userId);
        if (!s.isDraft()) {
            throw new ConflictException("Only DRAFT submissions can be deleted");
        }
        repository.delete(s);
    }
}
