package com.eneml.ajs.editorial.internal.web.dto;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;

import java.time.Instant;

public record EditorialDecisionResponse(
        Long id,
        Long submissionId,
        Long reviewRoundId,
        DecisionType decisionType,
        SubmissionStage previousStage,
        SubmissionStage newStage,
        SubmissionStatus newStatus,
        Long decidedByUserId,
        String summary,
        Instant dateDecided,
        long version,
        Instant updatedAt
) {
}
