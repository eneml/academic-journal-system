package com.eneml.ajs.editorial.api;

import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;

import java.time.Instant;

/**
 * Cross-module event fired whenever an editor takes a decision. The
 * {@code suppressDefaultEmail} flag tells listeners that the wizard
 * already handed the editor a chance to compose the outgoing email
 * directly — they should skip auto-rendering from templates and let
 * the corresponding {@link DecisionEmailRequested} event drive the
 * notification instead.
 */
public record DecisionMade(
        Long decisionId,
        Long submissionId,
        DecisionType type,
        SubmissionStage previousStage,
        SubmissionStage newStage,
        SubmissionStatus newStatus,
        Long decidedByUserId,
        boolean suppressDefaultEmail,
        Instant occurredAt
) {

    public static DecisionMade of(Long decisionId, Long submissionId, DecisionType type,
                                   SubmissionStage prev, SubmissionStage next,
                                   SubmissionStatus newStatus, Long decidedByUserId) {
        return new DecisionMade(decisionId, submissionId, type, prev, next, newStatus,
                decidedByUserId, false, Instant.now());
    }

    public static DecisionMade withSuppression(Long decisionId, Long submissionId, DecisionType type,
                                                SubmissionStage prev, SubmissionStage next,
                                                SubmissionStatus newStatus, Long decidedByUserId) {
        return new DecisionMade(decisionId, submissionId, type, prev, next, newStatus,
                decidedByUserId, true, Instant.now());
    }
}
