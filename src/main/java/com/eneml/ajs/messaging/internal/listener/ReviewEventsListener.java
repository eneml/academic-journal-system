package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.api.NotificationType;
import com.eneml.ajs.messaging.internal.application.NotificationDraft;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import com.eneml.ajs.messaging.internal.application.template.CanonicalEmailTemplateKey;
import com.eneml.ajs.messaging.internal.application.template.EmailTemplateService;
import com.eneml.ajs.messaging.internal.application.template.RenderedEmail;
import com.eneml.ajs.review.api.ReviewerInvited;
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

    @ApplicationModuleListener
    void on(ReviewerInvited event) {
        UserSummary reviewer = userDirectory.findById(event.reviewerUserId()).orElse(null);
        Optional<RenderedEmail> rendered = emailTemplates.render(
                CanonicalEmailTemplateKey.REVIEW_REQUEST.key(),
                reviewer == null ? null : reviewer.locale(),
                NotificationVars.forReviewerInvitation(reviewer, event.assignmentId()));
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
                "/reviewer/assignments/" + event.assignmentId()));
    }
}
