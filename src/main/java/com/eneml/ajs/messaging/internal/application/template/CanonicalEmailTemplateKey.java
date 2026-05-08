package com.eneml.ajs.messaging.internal.application.template;

/**
 * Canonical identifiers for templated emails the system can send. Listeners
 * resolve these keys through {@link EmailTemplateService}; the manager UI
 * iterates this enum to render the table-of-templates page.
 *
 * <p>Adding a new event family means adding a new value here and wiring the
 * relevant listener. Bootstrap ensures every value has a backing
 * {@code email_template} row so the manager can fill in subject + body before
 * the listener fires.
 */
public enum CanonicalEmailTemplateKey {

    SUBMISSION_ACKNOWLEDGEMENT(
            "submission.acknowledgement",
            "Sent to the corresponding author once a submission is finalised."),
    SUBMISSION_NEEDS_EDITOR(
            "submission.needsEditor",
            "Sent to managers + editors when a fresh submission lands in the queue."),

    DECISION_ACCEPT_NOTIFY_AUTHOR(
            "decision.accept.notifyAuthor",
            "Sent to the author when an editor accepts the manuscript."),
    DECISION_DECLINE_NOTIFY_AUTHOR(
            "decision.decline.notifyAuthor",
            "Sent to the author when an editor declines after review."),
    DECISION_INITIAL_DECLINE_NOTIFY_AUTHOR(
            "decision.initialDecline.notifyAuthor",
            "Sent to the author when a desk-rejection happens before review."),
    DECISION_REQUEST_REVISIONS_NOTIFY_AUTHOR(
            "decision.requestRevisions.notifyAuthor",
            "Sent to the author when revisions are requested in the same round."),
    DECISION_RESUBMIT_NOTIFY_AUTHOR(
            "decision.resubmit.notifyAuthor",
            "Sent to the author when a resubmission with a new round is required."),
    DECISION_NEW_REVIEW_ROUND_NOTIFY_AUTHOR(
            "decision.newReviewRound.notifyAuthor",
            "Sent to the author when a new external review round opens."),
    DECISION_CANCEL_REVIEW_ROUND_NOTIFY_AUTHOR(
            "decision.cancelReviewRound.notifyAuthor",
            "Sent to the author when an open review round is cancelled."),
    DECISION_SEND_TO_PRODUCTION_NOTIFY_AUTHOR(
            "decision.sendToProduction.notifyAuthor",
            "Sent to the author when the manuscript moves into production."),
    DECISION_BACK_FROM_PRODUCTION_NOTIFY_AUTHOR(
            "decision.backFromProduction.notifyAuthor",
            "Sent to the author when a manuscript is reverted out of production."),
    DECISION_BACK_FROM_COPYEDITING_NOTIFY_AUTHOR(
            "decision.backFromCopyediting.notifyAuthor",
            "Sent to the author when a manuscript is reverted out of copyediting."),
    DECISION_SKIP_REVIEW_NOTIFY_AUTHOR(
            "decision.skipReview.notifyAuthor",
            "Sent to the author when an editor accepts without external review."),
    DECISION_GENERIC_NOTIFY_AUTHOR(
            "decision.generic.notifyAuthor",
            "Generic editorial update — used as the fallback key for novel decision types."),

    DECISION_REVERT_DECLINE_NOTIFY_AUTHOR(
            "decision.revertDecline.notifyAuthor",
            "Sent to the author when a previous decline is reversed and the submission re-enters review."),
    DECISION_REVERT_INITIAL_DECLINE_NOTIFY_AUTHOR(
            "decision.revertInitialDecline.notifyAuthor",
            "Sent to the author when a previous desk-rejection is reversed and the submission re-enters the queue."),

    REVIEW_REQUEST(
            "review.request",
            "Sent to a reviewer with the initial assignment invitation."),
    REVIEW_ACKNOWLEDGEMENT(
            "review.acknowledgement",
            "Sent to the reviewer when an editor confirms a completed review."),
    REVIEW_UNASSIGN(
            "review.unassign",
            "Sent to the reviewer when their assignment is unassigned by an editor."),
    REVIEW_REINSTATE(
            "review.reinstate",
            "Sent to the reviewer when a previously declined assignment is reinstated."),

    DISCUSSION_OPENED(
            "discussion.opened",
            "Sent to participants when a workflow discussion is opened."),
    DISCUSSION_MESSAGE(
            "discussion.message",
            "Sent to participants when a new message is posted to a workflow discussion."),

    EDITORIAL_REMINDER(
            "editorial.reminder",
            "Monthly nudge to editors with open editorial work."),
    EDITORIAL_STATISTICS_REPORT(
            "editorial.statisticsReport",
            "Monthly KPI digest sent to admins.");

    private final String key;
    private final String description;

    CanonicalEmailTemplateKey(String key, String description) {
        this.key = key;
        this.description = description;
    }

    public String key() {
        return key;
    }

    public String description() {
        return description;
    }
}
