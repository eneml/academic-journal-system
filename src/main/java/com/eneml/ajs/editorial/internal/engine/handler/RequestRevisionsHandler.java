package com.eneml.ajs.editorial.internal.engine.handler;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.internal.engine.DecisionContext;
import com.eneml.ajs.editorial.internal.engine.DecisionOutcome;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.api.SubmissionSummary;
import org.springframework.stereotype.Component;

@Component
class RequestRevisionsHandler extends AbstractDecisionHandler {

    @Override public DecisionType type() { return DecisionType.REQUEST_REVISIONS; }

    @Override
    public DecisionOutcome decide(SubmissionSummary current, DecisionContext context) {
        requireStage(current, SubmissionStage.EXTERNAL_REVIEW);
        return DecisionOutcome.stay(current.stage(), SubmissionStatus.QUEUED);
    }
}
