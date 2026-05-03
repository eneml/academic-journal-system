package com.eneml.ajs.editorial.internal.engine;

import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;

/**
 * The pure output of a {@link DecisionHandler}: where the submission
 * should end up after the decision and which review-round side effect
 * (if any) should fire.
 */
public record DecisionOutcome(
        SubmissionStage newStage,
        SubmissionStatus newStatus,
        SideEffect sideEffect
) {

    public enum SideEffect {
        NONE,
        OPEN_NEXT_REVIEW_ROUND,
        CANCEL_LATEST_REVIEW_ROUND
    }

    public static DecisionOutcome stay(SubmissionStage stage, SubmissionStatus status) {
        return new DecisionOutcome(stage, status, SideEffect.NONE);
    }

    public static DecisionOutcome to(SubmissionStage newStage, SubmissionStatus newStatus) {
        return new DecisionOutcome(newStage, newStatus, SideEffect.NONE);
    }

    public DecisionOutcome withSideEffect(SideEffect effect) {
        return new DecisionOutcome(newStage, newStatus, effect);
    }
}
