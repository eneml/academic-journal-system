package com.eneml.ajs.submission.api;

/**
 * Cross-module write port — used by the editorial workflow engine to
 * apply stage / status transitions on a submission without reaching
 * into submission-module internals.
 */
public interface SubmissionWorkflow {

    void transitionStage(Long submissionId, SubmissionStage newStage, SubmissionStatus newStatus);
}
