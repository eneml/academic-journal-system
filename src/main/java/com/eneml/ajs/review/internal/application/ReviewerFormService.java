package com.eneml.ajs.review.internal.application;

import com.eneml.ajs.journal.api.SectionLookup;
import com.eneml.ajs.journal.api.SectionSummary;
import com.eneml.ajs.review.internal.domain.ReviewAssignment;
import com.eneml.ajs.review.internal.domain.ReviewForm;
import com.eneml.ajs.review.internal.domain.ReviewFormElement;
import com.eneml.ajs.review.internal.domain.ReviewFormResponse;
import com.eneml.ajs.review.internal.persistence.ReviewFormRepository;
import com.eneml.ajs.review.internal.persistence.ReviewFormResponseRepository;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionSummary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Reviewer-side: which review form (if any) is bound to this reviewer's
 * assignment, plus their already-saved answers. Resolution chain is
 * <em>assignment → review-round → submission → section.review_form_id</em>.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewerFormService {

    private final ReviewerInboxService inboxService;
    private final SubmissionLookup submissionLookup;
    private final SectionLookup sectionLookup;
    private final ReviewFormRepository formRepository;
    private final ReviewFormResponseRepository responseRepository;

    @Transactional(readOnly = true)
    public Result loadFor(Long assignmentId, Long userId) {
        ReviewAssignment a = inboxService.getMine(assignmentId, userId);
        Long submissionId = inboxService.submissionIdFor(a);
        SubmissionSummary submission = submissionLookup.findById(submissionId)
                .orElseThrow(() -> NotFoundException.of("Submission", submissionId));
        SectionSummary section = sectionLookup.findById(submission.sectionId())
                .orElseThrow(() -> NotFoundException.of("Section", submission.sectionId()));
        if (section.reviewFormId() == null) {
            return new Result(null, List.of());
        }
        Optional<ReviewForm> form = formRepository.findWithElementsById(section.reviewFormId());
        if (form.isEmpty() || !form.get().isActive()) {
            return new Result(null, List.of());
        }
        List<ReviewFormResponse> answers = responseRepository
                .findByReviewAssignmentIdOrderByElementSeqAsc(assignmentId);
        return new Result(form.get(), answers);
    }

    @Transactional
    public void saveAnswers(Long assignmentId, Long userId, Map<Long, String> answers) {
        ReviewAssignment a = inboxService.getMine(assignmentId, userId);
        Result current = loadFor(a.getId(), userId);
        if (current.form() == null) {
            throw new IllegalStateException("no review form bound to this section");
        }
        // Resolve element ids that actually belong to the bound form so a
        // misbehaving client can't write responses to other forms' elements.
        java.util.Set<Long> validIds = new java.util.HashSet<>();
        for (ReviewFormElement el : current.form().getElements()) validIds.add(el.getId());

        for (Map.Entry<Long, String> entry : answers.entrySet()) {
            Long elementId = entry.getKey();
            if (!validIds.contains(elementId)) continue;
            ReviewFormResponse row = responseRepository
                    .findByReviewAssignmentIdAndElementId(assignmentId, elementId)
                    .orElseGet(ReviewFormResponse::new);
            if (row.getId() == null) {
                row.setReviewAssignmentId(assignmentId);
                ReviewFormElement el = current.form().getElements().stream()
                        .filter(e -> e.getId().equals(elementId))
                        .findFirst()
                        .orElseThrow();
                row.setElement(el);
            }
            row.setResponseValue(entry.getValue());
            responseRepository.save(row);
        }
    }

    public record Result(ReviewForm form, List<ReviewFormResponse> answers) {}
}
