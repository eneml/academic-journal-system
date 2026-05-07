package com.eneml.ajs.messaging.internal.web.dto;

public record NotificationPreferenceEntry(
        String key,
        String description,
        boolean blocked) {
}
