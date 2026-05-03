package com.eneml.ajs.review.api;

import java.time.Instant;

public record ReviewerInvited(
        Long assignmentId,
        Long roundId,
        Long submissionId,
        Long reviewerUserId,
        ReviewMethod reviewMethod,
        Instant occurredAt
) {

    public static ReviewerInvited of(Long assignmentId, Long roundId, Long submissionId,
                                      Long reviewerUserId, ReviewMethod method) {
        return new ReviewerInvited(assignmentId, roundId, submissionId,
                reviewerUserId, method, Instant.now());
    }
}
