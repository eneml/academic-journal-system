package com.eneml.ajs.announcement.api;

import java.time.Instant;
import java.util.Map;

public record AnnouncementSummary(
        Long id,
        AnnouncementType type,
        Map<String, String> title,
        Map<String, String> body,
        String urlPath,
        Instant datePosted,
        Instant dateExpires,
        boolean pinned,
        boolean visible
) {
}
