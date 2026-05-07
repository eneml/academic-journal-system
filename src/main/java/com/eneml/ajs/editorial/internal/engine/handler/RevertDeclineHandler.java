package com.eneml.ajs.editorial.internal.engine.handler;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.internal.engine.DecisionContext;
import com.eneml.ajs.editorial.internal.engine.DecisionOutcome;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.api.SubmissionSummary;
import org.springframework.stereotype.Component;

/**
 * Reverses a previous {@link DecisionType#DECLINE}: if the submission
 * was declined post-review, drop the decline and re-queue it on the
 * stage where it was rejected so the editor can resume work.
 */
@Component
class RevertDeclineHandler extends AbstractDecisionHandler {

    @Override public DecisionType type() { return DecisionType.REVERT_DECLINE; }

    @Override
    public DecisionOutcome decide(SubmissionSummary current, DecisionContext context) {
        requireStage(current, SubmissionStage.EXTERNAL_REVIEW, SubmissionStage.EDITING);
        requireStatus(current, SubmissionStatus.DECLINED);
        return DecisionOutcome.to(current.stage(), SubmissionStatus.QUEUED);
    }
}
