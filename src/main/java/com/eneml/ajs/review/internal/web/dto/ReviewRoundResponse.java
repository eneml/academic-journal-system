package com.eneml.ajs.review.internal.web.dto;

import com.eneml.ajs.review.api.ReviewRoundStatus;
import com.eneml.ajs.submission.api.SubmissionStage;

import java.time.Instant;

public record ReviewRoundResponse(
        Long id,
        Long submissionId,
        SubmissionStage stage,
        int roundNumber,
        ReviewRoundStatus status,
        Instant dateStarted,
        Instant dateCompleted,
        long version,
        Instant updatedAt
) {
}
