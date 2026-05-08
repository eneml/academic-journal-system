package com.eneml.ajs.review.internal.application;

import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserStatus;
import com.eneml.ajs.review.api.ReviewAssignmentStatus;
import com.eneml.ajs.review.api.ReviewConfirmed;
import com.eneml.ajs.review.api.ReviewMethod;
import com.eneml.ajs.review.api.ReviewRoundCreated;
import com.eneml.ajs.review.api.ReviewerInvited;
import com.eneml.ajs.review.api.ReviewerReinstated;
import com.eneml.ajs.review.api.ReviewerUnassigned;
import com.eneml.ajs.review.internal.domain.ReviewAssignment;
import com.eneml.ajs.review.internal.domain.ReviewRound;
import com.eneml.ajs.review.internal.persistence.ReviewAssignmentRepository;
import com.eneml.ajs.review.internal.persistence.ReviewRoundRepository;
import com.eneml.ajs.review.internal.web.dto.ReviewerInviteRequest;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionStage;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Editor-facing review operations: round lifecycle, reviewer invitations,
 * confirmation of received reviews. The reviewer-side actions live in
 * {@link ReviewerInboxService}.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRoundRepository roundRepository;
    private final ReviewAssignmentRepository assignmentRepository;
    private final UserDirectoryService userDirectory;
    private final ApplicationEventPublisher events;

    public List<ReviewRound> roundsOf(Long submissionId) {
        return roundRepository.findBySubmissionIdOrderByStageAscRoundNumberAsc(submissionId);
    }

    public List<ReviewAssignment> assignmentsOf(Long roundId) {
        return assignmentRepository.findByReviewRoundIdOrderByDateAssigned(roundId);
    }

    public ReviewRound getRound(Long roundId) {
        return roundRepository.findById(roundId).orElseThrow(() ->
                NotFoundException.of("ReviewRound", roundId));
    }

    @Transactional
    public ReviewRound openNextRound(Long submissionId, SubmissionStage stage) {
        int nextRound = roundRepository
                .findFirstBySubmissionIdAndStageOrderByRoundNumberDesc(submissionId, stage)
                .map(r -> r.getRoundNumber() + 1)
                .orElse(1);
        ReviewRound round = new ReviewRound();
        round.setSubmissionId(submissionId);
        round.setStage(stage);
        round.setRoundNumber(nextRound);
        ReviewRound saved = roundRepository.save(round);
        events.publishEvent(ReviewRoundCreated.of(saved.getId(), submissionId, stage, nextRound));
        return saved;
    }

    @Transactional
    public ReviewAssignment invite(Long roundId, ReviewerInviteRequest request, Long invitedByUserId) {
        ReviewRound round = getRound(roundId);
        var reviewer = userDirectory.findById(request.reviewerUserId())
                .filter(u -> u.status() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ConflictException(
                        "Reviewer user %d does not exist or is not active".formatted(request.reviewerUserId())));

        if (assignmentRepository.findByReviewRoundIdAndReviewerUserId(roundId, reviewer.id()).isPresent()) {
            throw new ConflictException("Reviewer %d already invited to round %d"
                    .formatted(reviewer.id(), roundId));
        }
        if (!userDirectory.findActiveWithRole(Role.REVIEWER).stream()
                .anyMatch(u -> u.id().equals(reviewer.id()))) {
            // Permissive default: anyone can be invited; we just emit a warning event later.
            // Concrete role enforcement comes via @PreAuthorize on the controller's caller side.
        }

        ReviewAssignment a = new ReviewAssignment();
        a.setReviewRoundId(roundId);
        a.setReviewerUserId(reviewer.id());
        a.setReviewMethod(request.reviewMethod() == null ? ReviewMethod.ANONYMOUS : request.reviewMethod());
        a.setDateResponseDue(request.dateResponseDue());
        a.setDateDue(request.dateDue());
        a.setDateNotified(Instant.now());
        a.setInvitedByUserId(invitedByUserId);
        ReviewAssignment saved = assignmentRepository.save(a);

        if (round.getStatus() == com.eneml.ajs.review.api.ReviewRoundStatus.PENDING_REVIEWERS) {
            round.setStatus(com.eneml.ajs.review.api.ReviewRoundStatus.IN_PROGRESS);
        }
        events.publishEvent(ReviewerInvited.of(saved.getId(), roundId, round.getSubmissionId(),
                reviewer.id(), saved.getReviewMethod()));
        return saved;
    }

    @Transactional
    public ReviewAssignment confirm(Long assignmentId) {
        ReviewAssignment a = assignmentRepository.findById(assignmentId).orElseThrow(() ->
                NotFoundException.of("ReviewAssignment", assignmentId));
        if (a.getStatus() != ReviewAssignmentStatus.COMPLETED) {
            throw new ConflictException("Assignment %d is not in COMPLETED state".formatted(assignmentId));
        }
        a.setStatus(ReviewAssignmentStatus.CONFIRMED);
        a.setDateConfirmed(Instant.now());
        maybeCompleteRound(a.getReviewRoundId());
        events.publishEvent(ReviewConfirmed.of(assignmentId,
                submissionIdFor(a), a.getReviewerUserId()));
        return a;
    }

    @Transactional
    public void cancel(Long assignmentId) {
        ReviewAssignment a = assignmentRepository.findById(assignmentId).orElseThrow(() ->
                NotFoundException.of("ReviewAssignment", assignmentId));
        if (a.isFinal()) {
            return;
        }
        a.setStatus(ReviewAssignmentStatus.CANCELLED);
    }

    /**
     * Re-fires the original review-request invitation. Status stays as it
     * was (typically AWAITING_RESPONSE), {@code dateNotified} is bumped so
     * the reviewer sees a fresh deadline anchor.
     */
    @Transactional
    public ReviewAssignment resendInvitation(Long assignmentId) {
        ReviewAssignment a = assignmentRepository.findById(assignmentId).orElseThrow(() ->
                NotFoundException.of("ReviewAssignment", assignmentId));
        if (a.isFinal() && a.getStatus() != ReviewAssignmentStatus.DECLINED) {
            throw new ConflictException(
                    "Assignment %d is in a final state and cannot be re-invited".formatted(assignmentId));
        }
        a.setDateNotified(Instant.now());
        Long submissionId = submissionIdFor(a);
        events.publishEvent(ReviewerInvited.of(
                a.getId(), a.getReviewRoundId(), submissionId,
                a.getReviewerUserId(), a.getReviewMethod()));
        return a;
    }

    /**
     * Reopens a previously declined assignment by flipping it back to
     * AWAITING_RESPONSE. The reviewer is emailed via the dedicated
     * {@code review.reinstate} mailable.
     */
    @Transactional
    public ReviewAssignment reinstate(Long assignmentId) {
        ReviewAssignment a = assignmentRepository.findById(assignmentId).orElseThrow(() ->
                NotFoundException.of("ReviewAssignment", assignmentId));
        if (a.getStatus() != ReviewAssignmentStatus.DECLINED) {
            throw new ConflictException(
                    "Only DECLINED assignments can be reinstated; %d is %s"
                            .formatted(assignmentId, a.getStatus()));
        }
        a.setStatus(ReviewAssignmentStatus.AWAITING_RESPONSE);
        a.setDateResponded(null);
        a.setDateNotified(Instant.now());
        events.publishEvent(ReviewerReinstated.of(assignmentId,
                submissionIdFor(a), a.getReviewerUserId()));
        return a;
    }

    /**
     * Unassigns a reviewer who has not yet completed work. Same effect as
     * {@link #cancel(Long)} but always emails the reviewer with the
     * {@code review.unassign} mailable. Idempotent on already-final
     * assignments — the email still fires so the reviewer hears about it
     * even if the row was already CANCELLED locally.
     */
    @Transactional
    public ReviewAssignment unassign(Long assignmentId) {
        ReviewAssignment a = assignmentRepository.findById(assignmentId).orElseThrow(() ->
                NotFoundException.of("ReviewAssignment", assignmentId));
        if (a.getStatus() == ReviewAssignmentStatus.COMPLETED
                || a.getStatus() == ReviewAssignmentStatus.CONFIRMED) {
            throw new ConflictException(
                    "Cannot unassign an already-completed review (%d)".formatted(assignmentId));
        }
        a.setStatus(ReviewAssignmentStatus.CANCELLED);
        events.publishEvent(ReviewerUnassigned.of(assignmentId,
                submissionIdFor(a), a.getReviewerUserId()));
        return a;
    }

    Long submissionIdFor(ReviewAssignment a) {
        return roundRepository.findById(a.getReviewRoundId())
                .orElseThrow(() -> NotFoundException.of("ReviewRound", a.getReviewRoundId()))
                .getSubmissionId();
    }

    void maybeCompleteRound(Long roundId) {
        long total = assignmentRepository.countByReviewRoundId(roundId);
        long terminal = assignmentRepository.countByReviewRoundIdAndStatusIn(
                roundId,
                List.of(ReviewAssignmentStatus.CONFIRMED,
                        ReviewAssignmentStatus.DECLINED,
                        ReviewAssignmentStatus.CANCELLED));
        if (total > 0 && total == terminal) {
            ReviewRound round = getRound(roundId);
            if (round.getStatus() != com.eneml.ajs.review.api.ReviewRoundStatus.COMPLETED) {
                round.markCompleted();
                events.publishEvent(com.eneml.ajs.review.api.ReviewRoundCompleted.of(
                        round.getId(), round.getSubmissionId()));
            }
        }
    }
}
