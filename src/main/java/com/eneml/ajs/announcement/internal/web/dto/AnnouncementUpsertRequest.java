package com.eneml.ajs.announcement.internal.web.dto;

import com.eneml.ajs.announcement.api.AnnouncementType;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.util.Map;

public record AnnouncementUpsertRequest(
        AnnouncementType type,
        @NotEmpty Map<String, String> title,
        @NotEmpty Map<String, String> body,
        String urlPath,
        Instant dateExpires,
        Boolean pinned,
        Boolean visible
) {
}
