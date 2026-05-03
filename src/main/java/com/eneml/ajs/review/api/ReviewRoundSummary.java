package com.eneml.ajs.review.api;

import com.eneml.ajs.submission.api.SubmissionStage;

import java.time.Instant;

public record ReviewRoundSummary(
        Long id,
        Long submissionId,
        SubmissionStage stage,
        int roundNumber,
        ReviewRoundStatus status,
        Instant dateStarted,
        Instant dateCompleted
) {
}
