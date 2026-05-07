package com.eneml.ajs.announcement.internal.web.dto;

import com.eneml.ajs.announcement.api.AnnouncementType;

import java.time.Instant;
import java.util.Map;

public record AnnouncementResponse(
        Long id,
        AnnouncementType type,
        Map<String, String> title,
        Map<String, String> body,
        String urlPath,
        Instant datePosted,
        Instant dateExpires,
        boolean pinned,
        boolean visible,
        String ctaLabel,
        String ctaUrl,
        String guestEditors,
        Instant updatedAt
) {
}
