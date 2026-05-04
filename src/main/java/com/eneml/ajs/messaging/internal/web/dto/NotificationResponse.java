package com.eneml.ajs.messaging.internal.web.dto;

import com.eneml.ajs.messaging.api.NotificationLevel;

import java.time.Instant;

public record NotificationResponse(
        Long id,
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
}
