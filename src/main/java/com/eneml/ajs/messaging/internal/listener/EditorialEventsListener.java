package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.editorial.api.DecisionMade;
import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.api.NotificationType;
import com.eneml.ajs.messaging.internal.application.NotificationDraft;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import com.eneml.ajs.submission.api.SubmissionLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class EditorialEventsListener {

    private final NotificationService notifications;
    private final SubmissionLookup submissionLookup;

    @ApplicationModuleListener
    void on(DecisionMade event) {
        var submission = submissionLookup.findById(event.submissionId()).orElse(null);
        if (submission == null || submission.submittedByUserId() == null) {
            return;
        }
        var category = categoryOf(event.type());
        notifications.create(new NotificationDraft(
                submission.submittedByUserId(),
                category.type(),
                category.level(),
                category.title(),
                category.body(event.type()),
                "submission",
                event.submissionId(),
                "/author/submissions/" + event.submissionId()));
    }

    private record Category(String type, NotificationLevel level, String title) {
        String body(DecisionType decision) {
            return "An editor has taken a decision on your submission: " + decision + ".";
        }
    }

    private static Category categoryOf(DecisionType type) {
        return switch (type) {
            case ACCEPT, SKIP_REVIEW ->
                    new Category(NotificationType.DECISION_ACCEPT, NotificationLevel.NORMAL,
                            "Your manuscript was accepted");
            case DECLINE, INITIAL_DECLINE ->
                    new Category(NotificationType.DECISION_DECLINE, NotificationLevel.NORMAL,
                            "Editorial decision: declined");
            case REQUEST_REVISIONS ->
                    new Category(NotificationType.DECISION_REVISIONS, NotificationLevel.TASK,
                            "Revisions requested");
            case RESUBMIT_FOR_REVIEW ->
                    new Category(NotificationType.DECISION_RESUBMIT, NotificationLevel.TASK,
                            "Resubmission requested");
            case SEND_TO_PRODUCTION ->
                    new Category(NotificationType.DECISION_PRODUCTION, NotificationLevel.NORMAL,
                            "Sent to production");
            default ->
                    new Category(NotificationType.DECISION_GENERIC, NotificationLevel.NORMAL,
                            "Editorial update on your submission");
        };
    }
}
