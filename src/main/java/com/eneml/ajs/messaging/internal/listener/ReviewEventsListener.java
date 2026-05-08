package com.eneml.ajs.messaging.internal.listener;

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
import com.eneml.ajs.review.api.ReviewConfirmed;
import com.eneml.ajs.review.api.ReviewerInvited;
import com.eneml.ajs.review.api.ReviewerReinstated;
import com.eneml.ajs.review.api.ReviewerUnassigned;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
class ReviewEventsListener {

    private static final String FALLBACK_TITLE = "You have a new review request";
    private static final String FALLBACK_BODY = "Please respond to the review invitation.";

    private final NotificationService notifications;
    private final UserDirectoryService userDirectory;
    private final EmailTemplateService emailTemplates;
    private final JournalLookup journalLookup;
    private final MailLinks mailLinks;

    @ApplicationModuleListener
    void on(ReviewerInvited event) {
        UserSummary reviewer = userDirectory.findById(event.reviewerUserId()).orElse(null);
        JournalConfigSummary journal = journalLookup.getConfig();
        Optional<RenderedEmail> rendered = emailTemplates.render(
                CanonicalEmailTemplateKey.REVIEW_REQUEST.key(),
                reviewer == null ? null : reviewer.locale(),
                NotificationVars.reviewerInvitation(reviewer, event.assignmentId(), journal, mailLinks));
        String title = rendered.map(RenderedEmail::subject).orElse(FALLBACK_TITLE);
        String body = rendered.map(RenderedEmail::body).orElse(FALLBACK_BODY);
        notifications.create(new NotificationDraft(
                event.reviewerUserId(),
                NotificationType.REVIEWER_INVITED,
                NotificationLevel.TASK,
                title,
                body,
                "review-assignment",
                event.assignmentId(),
                "/reviewer/assignments/" + event.assignmentId(),
                CanonicalEmailTemplateKey.REVIEW_REQUEST.key()));
    }

    @ApplicationModuleListener
    void on(ReviewConfirmed event) {
        notifyReviewer(event.reviewerUserId(), event.assignmentId(),
                CanonicalEmailTemplateKey.REVIEW_ACKNOWLEDGEMENT,
                NotificationType.REVIEW_ACKNOWLEDGEMENT,
                NotificationLevel.NORMAL,
                "Thank you for your review",
                "The editor has confirmed receipt of your completed review.");
    }

    @ApplicationModuleListener
    void on(ReviewerUnassigned event) {
        notifyReviewer(event.reviewerUserId(), event.assignmentId(),
                CanonicalEmailTemplateKey.REVIEW_UNASSIGN,
                NotificationType.REVIEW_UNASSIGN,
                NotificationLevel.NORMAL,
                "Review assignment withdrawn",
                "The editor has withdrawn your review assignment. No further action is needed.");
    }

    @ApplicationModuleListener
    void on(ReviewerReinstated event) {
        notifyReviewer(event.reviewerUserId(), event.assignmentId(),
                CanonicalEmailTemplateKey.REVIEW_REINSTATE,
                NotificationType.REVIEW_REINSTATE,
                NotificationLevel.TASK,
                "Review invitation reopened",
                "Your previously declined review assignment has been reopened. Please respond again.");
    }

    private void notifyReviewer(Long reviewerUserId,
                                Long assignmentId,
                                CanonicalEmailTemplateKey templateKey,
                                String notificationType,
                                NotificationLevel level,
                                String fallbackTitle,
                                String fallbackBody) {
        UserSummary reviewer = userDirectory.findById(reviewerUserId).orElse(null);
        JournalConfigSummary journal = journalLookup.getConfig();
        Optional<RenderedEmail> rendered = emailTemplates.render(
                templateKey.key(),
                reviewer == null ? null : reviewer.locale(),
                NotificationVars.reviewerInvitation(reviewer, assignmentId, journal, mailLinks));
        String title = rendered.map(RenderedEmail::subject).orElse(fallbackTitle);
        String body = rendered.map(RenderedEmail::body).orElse(fallbackBody);
        notifications.create(new NotificationDraft(
                reviewerUserId,
                notificationType,
                level,
                title,
                body,
                "review-assignment",
                assignmentId,
                "/reviewer/assignments/" + assignmentId,
                templateKey.key()));
    }
}
