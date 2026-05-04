package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.api.NotificationType;
import com.eneml.ajs.messaging.internal.application.NotificationDraft;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import com.eneml.ajs.review.api.ReviewerInvited;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class ReviewEventsListener {

    private final NotificationService notifications;

    @ApplicationModuleListener
    void on(ReviewerInvited event) {
        notifications.create(new NotificationDraft(
                event.reviewerUserId(),
                NotificationType.REVIEWER_INVITED,
                NotificationLevel.TASK,
                "You have a new review request",
                "Please respond to the review invitation.",
                "review-assignment",
                event.assignmentId(),
                "/reviewer/assignments/" + event.assignmentId()));
    }
}
