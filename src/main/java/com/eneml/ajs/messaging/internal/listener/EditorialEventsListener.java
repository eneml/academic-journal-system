package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.editorial.api.DecisionMade;
import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.api.NotificationType;
import com.eneml.ajs.messaging.internal.application.NotificationDraft;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import com.eneml.ajs.messaging.internal.application.template.CanonicalEmailTemplateKey;
import com.eneml.ajs.messaging.internal.application.template.EmailTemplateService;
import com.eneml.ajs.messaging.internal.application.template.RenderedEmail;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
class EditorialEventsListener {

    private final NotificationService notifications;
    private final SubmissionLookup submissionLookup;
    private final UserDirectoryService userDirectory;
    private final EmailTemplateService emailTemplates;

    @ApplicationModuleListener
    void on(DecisionMade event) {
        SubmissionSummary submission = submissionLookup.findById(event.submissionId()).orElse(null);
        if (submission == null || submission.submittedByUserId() == null) {
            return;
        }
        UserSummary author = userDirectory.findById(submission.submittedByUserId()).orElse(null);
        Category category = categoryOf(event.type());
        Optional<RenderedEmail> rendered = emailTemplates.render(
                category.templateKey().key(),
                author == null ? null : author.locale(),
                NotificationVars.forDecisionEvent(submission, event.type(), author));
        String title = rendered.map(RenderedEmail::subject).orElse(category.fallbackTitle());
        String body = rendered.map(RenderedEmail::body).orElse(category.fallbackBody(event.type()));

        notifications.create(new NotificationDraft(
                submission.submittedByUserId(),
                category.notificationType(),
                category.level(),
                title,
                body,
                "submission",
                event.submissionId(),
                "/author/submissions/" + event.submissionId()));
    }

    /**
     * Maps an editorial decision to the notification category, the canonical
     * email-template key to look up, and the hardcoded fallback strings used
     * when no template is configured. The fallback copy is intentionally
     * generic — the manager UI is where polished wording lives.
     */
    private record Category(
            String notificationType,
            NotificationLevel level,
            CanonicalEmailTemplateKey templateKey,
            String fallbackTitle) {

        String fallbackBody(DecisionType decision) {
            return "An editor has taken a decision on your submission: " + decision + ".";
        }
    }

    private static Category categoryOf(DecisionType type) {
        return switch (type) {
            case ACCEPT -> new Category(
                    NotificationType.DECISION_ACCEPT, NotificationLevel.NORMAL,
                    CanonicalEmailTemplateKey.DECISION_ACCEPT_NOTIFY_AUTHOR,
                    "Your manuscript was accepted");
            case SKIP_REVIEW -> new Category(
                    NotificationType.DECISION_ACCEPT, NotificationLevel.NORMAL,
                    CanonicalEmailTemplateKey.DECISION_SKIP_REVIEW_NOTIFY_AUTHOR,
                    "Your manuscript was accepted");
            case DECLINE -> new Category(
                    NotificationType.DECISION_DECLINE, NotificationLevel.NORMAL,
                    CanonicalEmailTemplateKey.DECISION_DECLINE_NOTIFY_AUTHOR,
                    "Editorial decision: declined");
            case INITIAL_DECLINE -> new Category(
                    NotificationType.DECISION_DECLINE, NotificationLevel.NORMAL,
                    CanonicalEmailTemplateKey.DECISION_INITIAL_DECLINE_NOTIFY_AUTHOR,
                    "Editorial decision: declined");
            case REQUEST_REVISIONS -> new Category(
                    NotificationType.DECISION_REVISIONS, NotificationLevel.TASK,
                    CanonicalEmailTemplateKey.DECISION_REQUEST_REVISIONS_NOTIFY_AUTHOR,
                    "Revisions requested");
            case RESUBMIT_FOR_REVIEW -> new Category(
                    NotificationType.DECISION_RESUBMIT, NotificationLevel.TASK,
                    CanonicalEmailTemplateKey.DECISION_RESUBMIT_NOTIFY_AUTHOR,
                    "Resubmission requested");
            case NEW_REVIEW_ROUND -> new Category(
                    NotificationType.DECISION_GENERIC, NotificationLevel.NORMAL,
                    CanonicalEmailTemplateKey.DECISION_NEW_REVIEW_ROUND_NOTIFY_AUTHOR,
                    "A new review round has started");
            case CANCEL_REVIEW_ROUND -> new Category(
                    NotificationType.DECISION_GENERIC, NotificationLevel.NORMAL,
                    CanonicalEmailTemplateKey.DECISION_CANCEL_REVIEW_ROUND_NOTIFY_AUTHOR,
                    "Review round cancelled");
            case SEND_TO_PRODUCTION -> new Category(
                    NotificationType.DECISION_PRODUCTION, NotificationLevel.NORMAL,
                    CanonicalEmailTemplateKey.DECISION_SEND_TO_PRODUCTION_NOTIFY_AUTHOR,
                    "Sent to production");
            case BACK_FROM_PRODUCTION -> new Category(
                    NotificationType.DECISION_GENERIC, NotificationLevel.NORMAL,
                    CanonicalEmailTemplateKey.DECISION_BACK_FROM_PRODUCTION_NOTIFY_AUTHOR,
                    "Reverted from production");
            case BACK_FROM_COPYEDITING -> new Category(
                    NotificationType.DECISION_GENERIC, NotificationLevel.NORMAL,
                    CanonicalEmailTemplateKey.DECISION_BACK_FROM_COPYEDITING_NOTIFY_AUTHOR,
                    "Reverted from copyediting");
            case EXTERNAL_REVIEW -> new Category(
                    NotificationType.DECISION_GENERIC, NotificationLevel.NORMAL,
                    CanonicalEmailTemplateKey.DECISION_GENERIC_NOTIFY_AUTHOR,
                    "Submission moved to external review");
        };
    }
}
