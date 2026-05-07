package com.eneml.ajs.editorial.internal.engine.handler;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.internal.engine.DecisionContext;
import com.eneml.ajs.editorial.internal.engine.DecisionOutcome;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.api.SubmissionSummary;
import org.springframework.stereotype.Component;

/**
 * Reverses a previous {@link DecisionType#INITIAL_DECLINE} (a desk
 * rejection). Re-queues the submission at the SUBMISSION stage so an
 * editor can give it another look.
 */
@Component
class RevertInitialDeclineHandler extends AbstractDecisionHandler {

    @Override public DecisionType type() { return DecisionType.REVERT_INITIAL_DECLINE; }

    @Override
    public DecisionOutcome decide(SubmissionSummary current, DecisionContext context) {
        requireStage(current, SubmissionStage.SUBMISSION);
        requireStatus(current, SubmissionStatus.DECLINED);
        return DecisionOutcome.to(SubmissionStage.SUBMISSION, SubmissionStatus.QUEUED);
    }
}
