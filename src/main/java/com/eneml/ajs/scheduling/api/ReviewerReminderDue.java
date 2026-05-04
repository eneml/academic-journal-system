package com.eneml.ajs.scheduling.api;

import java.time.Instant;

/**
 * Emitted by the scheduling module when a reviewer assignment has
 * passed an outstanding deadline. Listeners (notifications, email)
 * decide what to do with it.
 */
public record ReviewerReminderDue(
        Long assignmentId,
        Long reviewRoundId,
        Long submissionId,
        Long reviewerUserId,
        Kind kind,
        Instant occurredAt
) {

    public enum Kind {
        /** Reviewer has not yet responded to the invitation. */
        RESPONSE_OVERDUE,
        /** Reviewer accepted but hasn't completed the review. */
        REVIEW_OVERDUE
    }

    public static ReviewerReminderDue of(Long assignmentId, Long roundId, Long submissionId,
                                          Long reviewerUserId, Kind kind) {
        return new ReviewerReminderDue(assignmentId, roundId, submissionId,
                reviewerUserId, kind, Instant.now());
    }
}
