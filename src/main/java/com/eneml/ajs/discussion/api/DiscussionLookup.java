package com.eneml.ajs.discussion.api;

import com.eneml.ajs.submission.api.SubmissionStage;

import java.util.List;

public interface DiscussionLookup {

    /** All discussions on the submission, optionally filtered by stage. */
    List<DiscussionSummary> listForSubmission(Long submissionId, SubmissionStage stage);

    /** Open discussions a user participates in. Used by the dashboard inbox. */
    List<DiscussionSummary> listForUser(Long userId);
}
