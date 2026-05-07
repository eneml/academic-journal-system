package com.eneml.ajs.review.api;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ReviewLookup {

    List<ReviewRoundSummary> roundsOf(Long submissionId);

    Optional<ReviewRoundSummary> latestRound(Long submissionId);

    List<ReviewAssignmentSummary> assignmentsForRound(Long roundId);

    List<ReviewAssignmentSummary> openAssignmentsForReviewer(Long reviewerUserId);

    /**
     * Active assignments whose response or completion deadline has passed
     * (i.e. {@code dateResponseDue < cutoff} or {@code dateDue < cutoff}
     * while the assignment is still {@code AWAITING_RESPONSE}, {@code ACCEPTED},
     * or {@code IN_PROGRESS}). Used by the reviewer-reminder sweep.
     */
    List<ReviewAssignmentSummary> overdueAssignments(Instant cutoff);

    /** Distinct reviewers with any assignment activity since {@code since}. */
    long countActiveReviewersSince(Instant since);
}
