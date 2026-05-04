package com.eneml.ajs.messaging.api;

import java.time.Instant;

public record NotificationSummary(
        Long id,
        Long userId,
        String type,
        NotificationLevel level,
        String title,
        String body,
        String assocType,
        Long assocId,
        String href,
        Instant readAt,
        Instant createdAt
) {
    public boolean isUnread() { return readAt == null; }
}
