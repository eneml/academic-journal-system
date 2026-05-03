package com.eneml.ajs.editorial.internal.engine.handler;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.internal.engine.DecisionContext;
import com.eneml.ajs.editorial.internal.engine.DecisionOutcome;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.api.SubmissionSummary;
import org.springframework.stereotype.Component;

@Component
class ExternalReviewHandler extends AbstractDecisionHandler {

    @Override public DecisionType type() { return DecisionType.EXTERNAL_REVIEW; }

    @Override
    public DecisionOutcome decide(SubmissionSummary current, DecisionContext context) {
        requireStage(current, SubmissionStage.SUBMISSION);
        requireStatus(current, SubmissionStatus.QUEUED, SubmissionStatus.DRAFT);
        return DecisionOutcome.to(SubmissionStage.EXTERNAL_REVIEW, SubmissionStatus.QUEUED)
                .withSideEffect(DecisionOutcome.SideEffect.OPEN_NEXT_REVIEW_ROUND);
    }
}
