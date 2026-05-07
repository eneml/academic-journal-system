package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.messaging.internal.application.template.MailVars;
import com.eneml.ajs.submission.api.SubmissionSummary;

import java.util.Map;

/**
 * Helpers that turn typed event payloads into the flat dotted-key
 * {@link MailVars} expected by Mustache templates. Keeping the variable
 * names in one place makes it cheap to keep the manager-UI variable picker
 * in sync with what listeners actually pass.
 */
final class NotificationVars {

    private NotificationVars() {}

    /** Variables available to {@code submission.*} templates. */
    static MailVars forSubmissionEvent(SubmissionSummary submission, UserSummary recipient) {
        MailVars vars = recipient(recipient);
        if (submission != null) {
            vars
                    .put("submission.id", submission.id())
                    .put("submission.title", pickTitle(submission, recipient))
                    .put("submission.url", "/editor/submissions/" + submission.id());
        }
        return vars;
    }

    /** Variables available to {@code decision.*} templates. */
    static MailVars forDecisionEvent(SubmissionSummary submission,
                                     DecisionType type,
                                     UserSummary recipient) {
        MailVars vars = recipient(recipient);
        if (submission != null) {
            vars
                    .put("submission.id", submission.id())
                    .put("submission.title", pickTitle(submission, recipient))
                    .put("submission.url", "/author/submissions/" + submission.id());
        }
        if (type != null) {
            vars.put("decision.type", type.name());
        }
        return vars;
    }

    /** Variables available to {@code review.request} and adjacent templates. */
    static MailVars forReviewerInvitation(UserSummary reviewer, Long assignmentId) {
        return recipient(reviewer)
                .put("assignment.id", assignmentId)
                .put("assignment.url", "/reviewer/assignments/" + assignmentId);
    }

    private static MailVars recipient(UserSummary user) {
        if (user == null) {
            return MailVars.create();
        }
        return MailVars.create()
                .put("recipient.givenName", user.givenName())
                .put("recipient.familyName", user.familyName())
                .put("recipient.fullName", user.fullName())
                .put("recipient.email", user.email());
    }

    /**
     * Picks the title in the recipient's locale, falling back to the
     * submission's own locale, then to any locale present, then to the
     * empty string.
     */
    private static String pickTitle(SubmissionSummary submission, UserSummary recipient) {
        Map<String, String> titles = submission.title();
        if (titles == null || titles.isEmpty()) return "";
        if (recipient != null && recipient.locale() != null) {
            String byRecipient = titles.get(recipient.locale());
            if (byRecipient != null && !byRecipient.isBlank()) return byRecipient;
        }
        if (submission.locale() != null) {
            String bySubmission = titles.get(submission.locale());
            if (bySubmission != null && !bySubmission.isBlank()) return bySubmission;
        }
        return titles.values().stream().filter(v -> v != null && !v.isBlank()).findFirst().orElse("");
    }
}
