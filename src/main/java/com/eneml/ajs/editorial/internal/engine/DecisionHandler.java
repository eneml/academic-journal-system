package com.eneml.ajs.editorial.internal.engine;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.submission.api.SubmissionSummary;

/**
 * Strategy for one specific {@link DecisionType}. Implementations are
 * pure functions of the current submission state plus the editor's
 * input — they don't perform any I/O. The {@link WorkflowEngine}
 * applies the resulting {@link DecisionOutcome}.
 */
public interface DecisionHandler {

    DecisionType type();

    DecisionOutcome decide(SubmissionSummary current, DecisionContext context);
}
