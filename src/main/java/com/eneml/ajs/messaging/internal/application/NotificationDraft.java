package com.eneml.ajs.messaging.internal.application;

import com.eneml.ajs.messaging.api.NotificationLevel;

/**
 * Request shape for creating a notification — used internally by the
 * domain-event listeners. Records as plain data, not exposed through
 * the public API (modules use ApplicationEventPublisher events instead
 * of calling NotificationService directly).
 *
 * <p>{@code templateKey} is optional. When present it must match a canonical
 * email-template key; the dispatcher uses it to consult the user's opt-out
 * matrix before sending mail. When absent the email is always sent (useful
 * for ad-hoc system messages that aren't tied to a templated event).
 */
public record NotificationDraft(
        Long userId,
        String type,
        NotificationLevel level,
        String title,
        String body,
        String assocType,
        Long assocId,
        String href,
        String templateKey
) {

    /** Convenience for call sites that don't have a templated event. */
    public NotificationDraft(Long userId, String type, NotificationLevel level,
                              String title, String body,
                              String assocType, Long assocId, String href) {
        this(userId, type, level, title, body, assocType, assocId, href, null);
    }
}
