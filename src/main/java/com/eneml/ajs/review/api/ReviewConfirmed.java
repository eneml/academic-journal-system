package com.eneml.ajs.review.api;

import java.time.Instant;

/**
 * Fired when an editor confirms receipt of a completed review. The reviewer
 * has finished their work; this event drives the thank-you mailable.
 */
public record ReviewConfirmed(
        Long assignmentId,
        Long submissionId,
        Long reviewerUserId,
        Instant occurredAt
) {

    public static ReviewConfirmed of(Long assignmentId, Long submissionId, Long reviewerUserId) {
        return new ReviewConfirmed(assignmentId, submissionId, reviewerUserId, Instant.now());
    }
}
