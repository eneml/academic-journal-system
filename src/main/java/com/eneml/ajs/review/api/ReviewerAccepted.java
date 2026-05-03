package com.eneml.ajs.review.api;

import java.time.Instant;

public record ReviewerAccepted(Long assignmentId, Long submissionId, Instant occurredAt) {

    public static ReviewerAccepted of(Long assignmentId, Long submissionId) {
        return new ReviewerAccepted(assignmentId, submissionId, Instant.now());
    }
}
