package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.identity.api.Role;
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
import com.eneml.ajs.messaging.internal.application.template.RenderedEmail;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionSubmitted;
import com.eneml.ajs.submission.api.SubmissionSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
class SubmissionEventsListener {

    private static final String EDITOR_FALLBACK_TITLE = "New submission for review";
    private static final String EDITOR_FALLBACK_BODY = "A new manuscript needs editorial triage.";
    private static final String AUTHOR_FALLBACK_TITLE = "We received your submission";
    private static final String AUTHOR_FALLBACK_BODY =
            "Thank you for submitting your manuscript. The editorial team will be in touch shortly.";

    private final NotificationService notifications;
    private final UserDirectoryService userDirectory;
    private final EmailTemplateService emailTemplates;
    private final SubmissionLookup submissionLookup;
    private final JournalLookup journalLookup;
    private final MailLinks mailLinks;

    @ApplicationModuleListener
    void on(SubmissionSubmitted event) {
        SubmissionSummary submission = submissionLookup.findById(event.submissionId()).orElse(null);
        JournalConfigSummary journal = journalLookup.getConfig();

        notifyEditors(event.submissionId(), submission, journal);
        notifyAuthor(event.submissionId(), event.submittedByUserId(), submission, journal);
    }

    private void notifyEditors(Long submissionId, SubmissionSummary submission, JournalConfigSummary journal) {
        for (UserSummary editor : userDirectory.findActiveWithRole(Role.EDITOR)) {
            Optional<RenderedEmail> rendered = emailTemplates.render(
                    CanonicalEmailTemplateKey.SUBMISSION_NEEDS_EDITOR.key(),
                    editor.locale(),
                    NotificationVars.submissionToEditor(submission, editor, journal, mailLinks));
            String title = rendered.map(RenderedEmail::subject).orElse(EDITOR_FALLBACK_TITLE);
            String body = rendered.map(RenderedEmail::body).orElse(EDITOR_FALLBACK_BODY);
            notifications.create(new NotificationDraft(
                    editor.id(),
                    NotificationType.SUBMISSION_SUBMITTED,
                    NotificationLevel.TASK,
                    title,
                    body,
                    "submission",
                    submissionId,
                    "/editor/submissions/" + submissionId));
        }
    }

    private void notifyAuthor(Long submissionId,
                              Long submittedByUserId,
                              SubmissionSummary submission,
                              JournalConfigSummary journal) {
        if (submittedByUserId == null) return;
        UserSummary author = userDirectory.findById(submittedByUserId).orElse(null);
        if (author == null) return;
        Optional<RenderedEmail> rendered = emailTemplates.render(
                CanonicalEmailTemplateKey.SUBMISSION_ACKNOWLEDGEMENT.key(),
                author.locale(),
                NotificationVars.submissionToAuthor(submission, author, journal, mailLinks));
        String title = rendered.map(RenderedEmail::subject).orElse(AUTHOR_FALLBACK_TITLE);
        String body = rendered.map(RenderedEmail::body).orElse(AUTHOR_FALLBACK_BODY);
        notifications.create(new NotificationDraft(
                submittedByUserId,
                NotificationType.SUBMISSION_SUBMITTED,
                NotificationLevel.NORMAL,
                title,
                body,
                "submission",
                submissionId,
                "/author/submissions/" + submissionId));
    }
}
