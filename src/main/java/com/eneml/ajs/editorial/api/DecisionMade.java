package com.eneml.ajs.editorial.api;

import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;

import java.time.Instant;

public record DecisionMade(
        Long decisionId,
        Long submissionId,
        DecisionType type,
        SubmissionStage previousStage,
        SubmissionStage newStage,
        SubmissionStatus newStatus,
        Long decidedByUserId,
        Instant occurredAt
) {

    public static DecisionMade of(Long decisionId, Long submissionId, DecisionType type,
                                   SubmissionStage prev, SubmissionStage next,
                                   SubmissionStatus newStatus, Long decidedByUserId) {
        return new DecisionMade(decisionId, submissionId, type, prev, next, newStatus,
                decidedByUserId, Instant.now());
    }
}
