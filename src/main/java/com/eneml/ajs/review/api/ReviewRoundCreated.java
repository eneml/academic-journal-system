package com.eneml.ajs.review.api;

import com.eneml.ajs.submission.api.SubmissionStage;

import java.time.Instant;

public record ReviewRoundCreated(
        Long roundId,
        Long submissionId,
        SubmissionStage stage,
        int roundNumber,
        Instant occurredAt
) {

    public static ReviewRoundCreated of(Long roundId, Long submissionId,
                                         SubmissionStage stage, int roundNumber) {
        return new ReviewRoundCreated(roundId, submissionId, stage, roundNumber, Instant.now());
    }
}
