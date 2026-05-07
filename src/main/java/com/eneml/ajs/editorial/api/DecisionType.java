package com.eneml.ajs.editorial.api;

public enum DecisionType {
    EXTERNAL_REVIEW,
    SKIP_REVIEW,
    INITIAL_DECLINE,
    ACCEPT,
    DECLINE,
    REQUEST_REVISIONS,
    RESUBMIT_FOR_REVIEW,
    NEW_REVIEW_ROUND,
    CANCEL_REVIEW_ROUND,
    SEND_TO_PRODUCTION,
    BACK_FROM_PRODUCTION,
    BACK_FROM_COPYEDITING,

    // ----------------------------------------------------------------
    // Recommendations — section editors operating under
    // stage_assignment.recommend_only file these as advisories. They
    // record a row in editorial_decision but do not change the
    // submission's stage or status; the deciding editor reads them
    // before taking a terminal decision.
    // ----------------------------------------------------------------
    RECOMMEND_ACCEPT,
    RECOMMEND_DECLINE,
    RECOMMEND_REVISIONS,
    RECOMMEND_RESUBMIT,

    // ----------------------------------------------------------------
    // Reverts — undo a previous decline. The submission goes from
    // STATUS_DECLINED back to STATUS_QUEUED on the appropriate stage
    // so the editor can keep working on it.
    // ----------------------------------------------------------------
    REVERT_DECLINE,
    REVERT_INITIAL_DECLINE
}
