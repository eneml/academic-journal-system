package com.eneml.ajs.review.api;

import java.time.Instant;

/**
 * Fired when an editor unassigns a reviewer from an open assignment. The
 * reviewer should be told their commitment is released.
 */
public record ReviewerUnassigned(
        Long assignmentId,
        Long submissionId,
        Long reviewerUserId,
        Instant occurredAt
) {

    public static ReviewerUnassigned of(Long assignmentId, Long submissionId, Long reviewerUserId) {
        return new ReviewerUnassigned(assignmentId, submissionId, reviewerUserId, Instant.now());
    }
}
