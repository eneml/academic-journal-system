package com.eneml.ajs.journal.internal.web.dto;

import java.time.Instant;
import java.util.Map;

public record MastheadEntryResponse(
        Long id,
        Long userId,
        Map<String, String> roleLabel,
        Map<String, String> bioOverride,
        int displayOrder,
        boolean visible,
        long version,
        Instant updatedAt
) {
}
