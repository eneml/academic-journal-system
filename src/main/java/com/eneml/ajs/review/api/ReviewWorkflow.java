package com.eneml.ajs.review.api;

import com.eneml.ajs.submission.api.SubmissionStage;

/**
 * Cross-module write hook used by the editorial module so taking a
 * decision (e.g. EXTERNAL_REVIEW, RESUBMIT_FOR_REVIEW) can open the
 * corresponding review round atomically with the decision itself.
 */
public interface ReviewWorkflow {

    ReviewRoundSummary openNextRound(Long submissionId, SubmissionStage stage);

    void cancelRound(Long roundId);
}
