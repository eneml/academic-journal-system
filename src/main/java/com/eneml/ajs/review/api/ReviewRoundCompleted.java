package com.eneml.ajs.review.api;

import java.time.Instant;

public record ReviewRoundCompleted(Long roundId, Long submissionId, Instant occurredAt) {

    public static ReviewRoundCompleted of(Long roundId, Long submissionId) {
        return new ReviewRoundCompleted(roundId, submissionId, Instant.now());
    }
}
