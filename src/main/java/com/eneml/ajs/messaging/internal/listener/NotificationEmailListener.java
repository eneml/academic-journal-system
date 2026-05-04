package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.messaging.api.NotificationCreated;
import com.eneml.ajs.messaging.internal.application.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Fans out one outbound email per persisted in-app notification. Runs in
 * the post-commit modulith listener so a failed delivery never rolls
 * back the user's notification record — they still see the alert in the
 * editorial app even if SMTP is unhealthy.
 */
@Component
@RequiredArgsConstructor
class NotificationEmailListener {

    private final MailService mailService;

    @ApplicationModuleListener
    void on(NotificationCreated event) {
        mailService.sendForNotification(event.notificationId());
    }
}
