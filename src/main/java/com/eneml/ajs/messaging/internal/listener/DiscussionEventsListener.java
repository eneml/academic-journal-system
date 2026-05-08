package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.discussion.api.DiscussionMessagePosted;
import com.eneml.ajs.discussion.api.DiscussionStarted;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.api.NotificationType;
import com.eneml.ajs.messaging.internal.application.NotificationDraft;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import com.eneml.ajs.messaging.internal.application.template.CanonicalEmailTemplateKey;
import com.eneml.ajs.messaging.internal.application.template.EmailTemplateService;
import com.eneml.ajs.messaging.internal.application.template.MailVars;
import com.eneml.ajs.messaging.internal.application.template.RenderedEmail;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
class DiscussionEventsListener {

    private final NotificationService notifications;
    private final UserDirectoryService userDirectory;
    private final SubmissionLookup submissionLookup;
    private final EmailTemplateService emailTemplates;
    private final JournalLookup journalLookup;
    private final MailLinks mailLinks;

    @ApplicationModuleListener
    void on(DiscussionStarted event) {
        SubmissionSummary submission = submissionLookup.findById(event.submissionId()).orElse(null);
        JournalConfigSummary journal = journalLookup.getConfig();
        UserSummary opener = event.startedByUserId() == null
                ? null
                : userDirectory.findById(event.startedByUserId()).orElse(null);
        for (Long uid : event.participantUserIds()) {
            if (uid.equals(event.startedByUserId())) continue; // don't notify the opener
            UserSummary recipient = userDirectory.findById(uid).orElse(null);
            if (recipient == null) continue;
            String href = "/editor/submissions/" + event.submissionId() + "#tab-discussions";
            MailVars vars = baseVars(submission, recipient, opener, journal)
                    .put("discussion.id", event.discussionId())
                    .put("discussion.subject", event.subject())
                    .put("discussion.url", mailLinks.editor(href));
            Optional<RenderedEmail> rendered = emailTemplates.render(
                    CanonicalEmailTemplateKey.DISCUSSION_OPENED.key(),
                    recipient.locale(),
                    vars);
            String title = rendered.map(RenderedEmail::subject)
                    .orElse("New discussion: " + event.subject());
            String body = rendered.map(RenderedEmail::body).orElse(
                    "A new discussion has been opened on a submission you participate in.");
            notifications.create(new NotificationDraft(
                    uid,
                    NotificationType.DISCUSSION_OPENED,
                    NotificationLevel.NORMAL,
                    title,
                    body,
                    "discussion",
                    event.discussionId(),
                    href,
                    CanonicalEmailTemplateKey.DISCUSSION_OPENED.key()));
        }
    }

    @ApplicationModuleListener
    void on(DiscussionMessagePosted event) {
        SubmissionSummary submission = submissionLookup.findById(event.submissionId()).orElse(null);
        JournalConfigSummary journal = journalLookup.getConfig();
        UserSummary author = event.authorUserId() == null
                ? null
                : userDirectory.findById(event.authorUserId()).orElse(null);
        for (Long uid : event.recipientUserIds()) {
            UserSummary recipient = userDirectory.findById(uid).orElse(null);
            if (recipient == null) continue;
            String href = "/editor/submissions/" + event.submissionId() + "#tab-discussions";
            MailVars vars = baseVars(submission, recipient, author, journal)
                    .put("discussion.id", event.discussionId())
                    .put("discussion.subject", event.subject())
                    .put("discussion.url", mailLinks.editor(href));
            Optional<RenderedEmail> rendered = emailTemplates.render(
                    CanonicalEmailTemplateKey.DISCUSSION_MESSAGE.key(),
                    recipient.locale(),
                    vars);
            String title = rendered.map(RenderedEmail::subject)
                    .orElse("New message in: " + event.subject());
            String body = rendered.map(RenderedEmail::body).orElse(
                    "A new message has been posted on a discussion you participate in.");
            notifications.create(new NotificationDraft(
                    uid,
                    NotificationType.DISCUSSION_MESSAGE,
                    NotificationLevel.TASK,
                    title,
                    body,
                    "discussion",
                    event.discussionId(),
                    href,
                    CanonicalEmailTemplateKey.DISCUSSION_MESSAGE.key()));
        }
    }

    private MailVars baseVars(SubmissionSummary submission,
                                UserSummary recipient,
                                UserSummary sender,
                                JournalConfigSummary journal) {
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
                    .put("sender.fullName", sender.fullName())
                    .put("sender.email", sender.email());
        }
        if (journal != null && journal.name() != null) {
            String name = pickJournalName(journal, recipient);
            vars.put("journal.name", name);
        }
        if (mailLinks != null) {
            vars.put("journal.url", mailLinks.publicBase());
        }
        if (submission != null) {
            vars.put("submission.id", submission.id());
            vars.put("submission.title", pickTitle(submission, recipient, journal));
        }
        return vars;
    }

    private static String pickJournalName(JournalConfigSummary journal, UserSummary recipient) {
        if (journal.name() == null || journal.name().isEmpty()) return "";
        if (recipient != null && recipient.locale() != null) {
            String s = journal.name().get(recipient.locale());
            if (s != null && !s.isBlank()) return s;
        }
        if (journal.defaultLocale() != null) {
            String s = journal.name().get(journal.defaultLocale());
            if (s != null && !s.isBlank()) return s;
        }
        return journal.name().values().stream().filter(v -> v != null && !v.isBlank()).findFirst().orElse("");
    }

    private static String pickTitle(SubmissionSummary submission,
                                    UserSummary recipient,
                                    JournalConfigSummary journal) {
        if (submission.title() == null || submission.title().isEmpty()) return "";
        if (recipient != null && recipient.locale() != null) {
            String s = submission.title().get(recipient.locale());
            if (s != null && !s.isBlank()) return s;
        }
        if (journal != null && journal.defaultLocale() != null) {
            String s = submission.title().get(journal.defaultLocale());
            if (s != null && !s.isBlank()) return s;
        }
        return submission.title().values().stream().filter(v -> v != null && !v.isBlank()).findFirst().orElse("");
    }
}
