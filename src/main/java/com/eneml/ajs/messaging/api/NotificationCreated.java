package com.eneml.ajs.messaging.api;

import java.time.Instant;

public record NotificationCreated(
        Long notificationId,
        Long userId,
        String type,
        Instant occurredAt
) {

    public static NotificationCreated of(Long notificationId, Long userId, String type) {
        return new NotificationCreated(notificationId, userId, type, Instant.now());
    }
}
