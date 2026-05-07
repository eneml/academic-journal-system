package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.messaging.internal.application.template.MailVars;
import com.eneml.ajs.submission.api.SubmissionSummary;

import java.util.Map;

/**
 * Helpers that turn typed event payloads into the flat dotted-key
 * {@link MailVars} expected by Mustache templates. Keeping the variable
 * names in one place makes it cheap to keep the manager-UI variable picker
 * in sync with what listeners actually pass.
 *
 * <p>All URLs are absolute — the email renderer can't prepend a base later
 * because the template body is opaque to it. The {@link MailLinks} helper
 * resolves the right host per audience (editorial app vs public site).
 */
final class NotificationVars {

    private NotificationVars() {}

    /** Fresh-submission notification to managers / editors. */
    static MailVars submissionToEditor(SubmissionSummary submission,
                                       UserSummary recipient,
                                       JournalConfigSummary journal,
                                       MailLinks links) {
        MailVars vars = base(recipient, null, journal, links);
        if (submission != null) {
            vars
                    .put("submission.id", submission.id())
                    .put("submission.title", pickTitle(submission, recipient, journal))
                    .put("submission.url", links.editor("/editor/submissions/" + submission.id()));
        }
        return vars;
    }

    /** Acknowledgement to the corresponding author. */
    static MailVars submissionToAuthor(SubmissionSummary submission,
                                       UserSummary recipient,
                                       JournalConfigSummary journal,
                                       MailLinks links) {
        MailVars vars = base(recipient, null, journal, links);
        if (submission != null) {
            vars
                    .put("submission.id", submission.id())
                    .put("submission.title", pickTitle(submission, recipient, journal))
                    .put("submission.url", links.editor("/author/submissions/" + submission.id()));
        }
        return vars;
    }

    /** Decision notification to the author of the work. */
    static MailVars decisionToAuthor(SubmissionSummary submission,
                                     DecisionType type,
                                     UserSummary recipient,
                                     UserSummary sender,
                                     JournalConfigSummary journal,
                                     MailLinks links) {
        MailVars vars = base(recipient, sender, journal, links);
        if (submission != null) {
            vars
                    .put("submission.id", submission.id())
                    .put("submission.title", pickTitle(submission, recipient, journal))
                    .put("submission.url", links.editor("/author/submissions/" + submission.id()));
        }
        if (type != null) {
            vars.put("decision.type", type.name());
        }
        return vars;
    }

    /** Initial reviewer invitation. */
    static MailVars reviewerInvitation(UserSummary reviewer,
                                       Long assignmentId,
                                       JournalConfigSummary journal,
                                       MailLinks links) {
        return base(reviewer, null, journal, links)
                .put("assignment.id", assignmentId)
                .put("assignment.url", links.editor("/reviewer/assignments/" + assignmentId));
    }

    private static MailVars base(UserSummary recipient,
                                 UserSummary sender,
                                 JournalConfigSummary journal,
                                 MailLinks links) {
        MailVars vars = MailVars.create();
        if (recipient != null) {
            vars
                    .put("recipient.givenName", recipient.givenName())
                    .put("recipient.familyName", recipient.familyName())
                    .put("recipient.fullName", recipient.fullName())
                    .put("recipient.email", recipient.email());
        }
        if (sender != null) {
            vars
                    .put("sender.givenName", sender.givenName())
                    .put("sender.familyName", sender.familyName())
                    .put("sender.fullName", sender.fullName())
                    .put("sender.email", sender.email());
        }
        if (journal != null) {
            vars.put("journal.name", pickJournalName(journal, recipient));
        }
        if (links != null) {
            vars.put("journal.url", links.publicBase());
        }
        return vars;
    }

    private static String pickJournalName(JournalConfigSummary journal, UserSummary recipient) {
        Map<String, String> names = journal.name();
        if (names == null || names.isEmpty()) return "";
        if (recipient != null && recipient.locale() != null) {
            String byRecipient = names.get(recipient.locale());
            if (byRecipient != null && !byRecipient.isBlank()) return byRecipient;
        }
        if (journal.defaultLocale() != null) {
            String byDefault = names.get(journal.defaultLocale());
            if (byDefault != null && !byDefault.isBlank()) return byDefault;
        }
        return names.values().stream().filter(v -> v != null && !v.isBlank()).findFirst().orElse("");
    }

    /**
     * Picks the title in the recipient's locale, falling back to the journal's
     * default, then the submission's own locale, then any non-blank entry.
     */
    private static String pickTitle(SubmissionSummary submission,
                                    UserSummary recipient,
                                    JournalConfigSummary journal) {
        Map<String, String> titles = submission.title();
        if (titles == null || titles.isEmpty()) return "";
        if (recipient != null && recipient.locale() != null) {
            String byRecipient = titles.get(recipient.locale());
            if (byRecipient != null && !byRecipient.isBlank()) return byRecipient;
        }
        if (journal != null && journal.defaultLocale() != null) {
            String byJournal = titles.get(journal.defaultLocale());
            if (byJournal != null && !byJournal.isBlank()) return byJournal;
        }
        if (submission.locale() != null) {
            String bySubmission = titles.get(submission.locale());
            if (bySubmission != null && !bySubmission.isBlank()) return bySubmission;
        }
        return titles.values().stream().filter(v -> v != null && !v.isBlank()).findFirst().orElse("");
    }
}
