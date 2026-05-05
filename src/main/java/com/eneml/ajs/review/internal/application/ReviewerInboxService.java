package com.eneml.ajs.review.internal.application;

import com.eneml.ajs.review.api.ReviewAssignmentStatus;
import com.eneml.ajs.review.api.ReviewSubmitted;
import com.eneml.ajs.review.api.ReviewerAccepted;
import com.eneml.ajs.review.api.ReviewerDeclined;
import com.eneml.ajs.review.internal.domain.ReviewAssignment;
import com.eneml.ajs.review.internal.domain.ReviewRound;
import com.eneml.ajs.review.internal.persistence.ReviewAssignmentRepository;
import com.eneml.ajs.review.internal.persistence.ReviewRoundRepository;
import com.eneml.ajs.review.internal.web.dto.ReviewSubmissionRequest;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Reviewer-facing operations on assignments. Service-level checks
 * confirm the actor matches {@code reviewerUserId} on the assignment.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewerInboxService {

    private final ReviewAssignmentRepository assignmentRepository;
    private final ReviewRoundRepository roundRepository;
    private final ReviewService reviewService;
    private final ApplicationEventPublisher events;

    public List<ReviewAssignment> myOpen(Long reviewerUserId) {
        return assignmentRepository.findOpenForReviewer(reviewerUserId);
    }

    public ReviewAssignment getMine(Long assignmentId, Long reviewerUserId) {
        ReviewAssignment a = assignmentRepository.findById(assignmentId).orElseThrow(() ->
                NotFoundException.of("ReviewAssignment", assignmentId));
        if (!a.getReviewerUserId().equals(reviewerUserId)) {
            throw new AccessDeniedException(
                    "Assignment %d not assigned to user %d".formatted(assignmentId, reviewerUserId));
        }
        return a;
    }

    @Transactional
    public ReviewAssignment respond(Long assignmentId, Long reviewerUserId, boolean accept, String message) {
        ReviewAssignment a = getMine(assignmentId, reviewerUserId);
        if (!a.canRespond()) {
            throw new ConflictException("Assignment %d already responded to".formatted(assignmentId));
        }
        a.setDateResponded(Instant.now());
        if (accept) {
            a.setStatus(ReviewAssignmentStatus.ACCEPTED);
            events.publishEvent(ReviewerAccepted.of(assignmentId, submissionIdOf(a)));
        } else {
            a.setStatus(ReviewAssignmentStatus.DECLINED);
            events.publishEvent(ReviewerDeclined.of(assignmentId, submissionIdOf(a), message));
            // A declined invitation may complete the round if it was the
            // last outstanding item; let ReviewService check.
            reviewService.maybeCompleteRound(a.getReviewRoundId());
        }
        return a;
    }

    @Transactional
    public ReviewAssignment submitReview(Long assignmentId, Long reviewerUserId,
                                          ReviewSubmissionRequest request) {
        ReviewAssignment a = getMine(assignmentId, reviewerUserId);
        if (!a.canSubmitReview()) {
            throw new ConflictException(
                    "Assignment %d is not in a state that accepts a review submission".formatted(assignmentId));
        }
        a.setRecommendation(request.recommendation());
        a.setCommentsToEditor(request.commentsToEditor());
        a.setCommentsToAuthor(request.commentsToAuthor());
        a.setCompetingInterests(request.competingInterests());
        a.setStatus(ReviewAssignmentStatus.COMPLETED);
        a.setDateCompleted(Instant.now());

        events.publishEvent(ReviewSubmitted.of(assignmentId, submissionIdOf(a),
                reviewerUserId, request.recommendation()));
        return a;
    }

    private Long submissionIdOf(ReviewAssignment a) {
        return submissionIdFor(a);
    }

    /**
     * Public version exposed to controllers that need to fetch the
     * manuscript belonging to a reviewer's assignment.
     */
    public Long submissionIdFor(ReviewAssignment a) {
        ReviewRound round = roundRepository.findById(a.getReviewRoundId()).orElseThrow(() ->
                NotFoundException.of("ReviewRound", a.getReviewRoundId()));
        return round.getSubmissionId();
    }
}
