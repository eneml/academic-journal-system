package com.eneml.ajs.messaging.api;

/**
 * Stable string keys for notification categories so frontends can pick
 * an icon/color without parsing the title.
 */
public final class NotificationType {

    public static final String SUBMISSION_SUBMITTED  = "submission.submitted";
    public static final String DECISION_ACCEPT       = "decision.accept";
    public static final String DECISION_DECLINE      = "decision.decline";
    public static final String DECISION_REVISIONS    = "decision.revisions";
    public static final String DECISION_RESUBMIT     = "decision.resubmit";
    public static final String DECISION_PRODUCTION   = "decision.send-to-production";
    public static final String DECISION_GENERIC      = "decision.generic";
    public static final String REVIEWER_INVITED      = "reviewer.invited";
    public static final String REVIEW_SUBMITTED      = "review.submitted";
    public static final String REVIEW_ACKNOWLEDGEMENT = "review.acknowledgement";
    public static final String REVIEW_UNASSIGN       = "review.unassign";
    public static final String REVIEW_REINSTATE      = "review.reinstate";
    public static final String PUBLICATION_PUBLISHED = "publication.published";
    public static final String DISCUSSION_OPENED     = "discussion.opened";
    public static final String DISCUSSION_MESSAGE    = "discussion.message";
    public static final String EDITORIAL_REMINDER    = "editorial.reminder";
    public static final String EDITORIAL_STATS       = "editorial.statisticsReport";

    private NotificationType() {}
}
