package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.editorial.api.DecisionEmailRequested;
import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.api.NotificationType;
import com.eneml.ajs.messaging.internal.application.NotificationDraft;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Persists the in-app notification + queues the email when an editor
 * uses the decision wizard to compose a custom message. Mirrors what
 * {@link EditorialEventsListener} does in the auto-render path, except
 * subject + body come from the editor verbatim instead of being looked
 * up through the template service.
 */
@Component
@RequiredArgsConstructor
class DecisionEmailRequestListener {

    private final NotificationService notifications;

    @ApplicationModuleListener
    void on(DecisionEmailRequested event) {
        if (event.recipientUserId() == null) return;
        notifications.create(new NotificationDraft(
                event.recipientUserId(),
                notificationTypeFor(event.decisionType()),
                levelFor(event.decisionType()),
                event.subject(),
                event.body(),
                "submission",
                event.submissionId(),
                "/author/submissions/" + event.submissionId(),
                event.templateKey()));
    }

    private static String notificationTypeFor(DecisionType type) {
        return switch (type) {
            case ACCEPT, SKIP_REVIEW -> NotificationType.DECISION_ACCEPT;
            case DECLINE, INITIAL_DECLINE -> NotificationType.DECISION_DECLINE;
            case REQUEST_REVISIONS -> NotificationType.DECISION_REVISIONS;
            case RESUBMIT_FOR_REVIEW -> NotificationType.DECISION_RESUBMIT;
            case SEND_TO_PRODUCTION -> NotificationType.DECISION_PRODUCTION;
            default -> NotificationType.DECISION_GENERIC;
        };
    }

    private static NotificationLevel levelFor(DecisionType type) {
        return switch (type) {
            case REQUEST_REVISIONS, RESUBMIT_FOR_REVIEW -> NotificationLevel.TASK;
            default -> NotificationLevel.NORMAL;
        };
    }
}
