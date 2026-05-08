package com.eneml.ajs.review.api;

import java.time.Instant;

/**
 * Fired when an editor reinstates a previously declined assignment, flipping
 * its status back to {@link ReviewAssignmentStatus#AWAITING_RESPONSE}. The
 * reviewer needs to be told the invitation has been reopened.
 */
public record ReviewerReinstated(
        Long assignmentId,
        Long submissionId,
        Long reviewerUserId,
        Instant occurredAt
) {

    public static ReviewerReinstated of(Long assignmentId, Long submissionId, Long reviewerUserId) {
        return new ReviewerReinstated(assignmentId, submissionId, reviewerUserId, Instant.now());
    }
}
