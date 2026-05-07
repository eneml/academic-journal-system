package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.api.NotificationType;
import com.eneml.ajs.messaging.internal.application.NotificationDraft;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import com.eneml.ajs.messaging.internal.application.template.CanonicalEmailTemplateKey;
import com.eneml.ajs.messaging.internal.application.template.EmailTemplateService;
import com.eneml.ajs.messaging.internal.application.template.MailVars;
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

    private static final String FALLBACK_TITLE = "New submission for review";
    private static final String FALLBACK_BODY = "A new manuscript needs editorial triage.";

    private final NotificationService notifications;
    private final UserDirectoryService userDirectory;
    private final EmailTemplateService emailTemplates;
    private final SubmissionLookup submissionLookup;

    @ApplicationModuleListener
    void on(SubmissionSubmitted event) {
        SubmissionSummary submission = submissionLookup.findById(event.submissionId()).orElse(null);
        for (UserSummary editor : userDirectory.findActiveWithRole(Role.EDITOR)) {
            Optional<RenderedEmail> rendered = emailTemplates.render(
                    CanonicalEmailTemplateKey.SUBMISSION_NEEDS_EDITOR.key(),
                    editor.locale(),
                    NotificationVars.forSubmissionEvent(submission, editor));
            String title = rendered.map(RenderedEmail::subject).orElse(FALLBACK_TITLE);
            String body = rendered.map(RenderedEmail::body).orElse(FALLBACK_BODY);
            notifications.create(new NotificationDraft(
                    editor.id(),
                    NotificationType.SUBMISSION_SUBMITTED,
                    NotificationLevel.TASK,
                    title,
                    body,
                    "submission",
                    event.submissionId(),
                    "/editor/submissions/" + event.submissionId()));
        }
    }
}
