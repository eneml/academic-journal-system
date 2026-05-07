package com.eneml.ajs.messaging.internal.web.dto;

import java.util.List;

public record NotificationPreferencesResponse(
        List<NotificationPreferenceEntry> entries) {
}
