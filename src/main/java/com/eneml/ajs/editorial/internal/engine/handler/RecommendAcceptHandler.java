package com.eneml.ajs.editorial.internal.engine.handler;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.internal.engine.DecisionContext;
import com.eneml.ajs.editorial.internal.engine.DecisionOutcome;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionSummary;
import org.springframework.stereotype.Component;

/**
 * A non-binding "I would accept" advisory filed by a section editor in
 * recommend-only mode. Records a history row but leaves the submission
 * exactly where it was — the deciding editor is the only one who can
 * commit a stage transition.
 */
@Component
class RecommendAcceptHandler extends AbstractDecisionHandler {

    @Override public DecisionType type() { return DecisionType.RECOMMEND_ACCEPT; }

    @Override
    public DecisionOutcome decide(SubmissionSummary current, DecisionContext context) {
        requireStage(current, SubmissionStage.EXTERNAL_REVIEW);
        return DecisionOutcome.stay(current.stage(), current.status());
    }
}
