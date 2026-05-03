package com.eneml.ajs.review.api;

import java.time.Instant;

public record ReviewerDeclined(Long assignmentId, Long submissionId,
                                String reason, Instant occurredAt) {

    public static ReviewerDeclined of(Long assignmentId, Long submissionId, String reason) {
        return new ReviewerDeclined(assignmentId, submissionId, reason, Instant.now());
    }
}
