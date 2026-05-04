package com.eneml.ajs.messaging.internal.application;

import com.eneml.ajs.messaging.api.NotificationLevel;

/**
 * Request shape for creating a notification — used internally by the
 * domain-event listeners. Records as plain data, not exposed through
 * the public API (modules use ApplicationEventPublisher events instead
 * of calling NotificationService directly).
 */
public record NotificationDraft(
        Long userId,
        String type,
        NotificationLevel level,
        String title,
        String body,
        String assocType,
        Long assocId,
        String href
) {
}
