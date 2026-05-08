package com.eneml.ajs.highlight.internal.web.dto;

import java.time.Instant;
import java.util.Map;

public record HighlightResponse(
        Long id,
        int sortOrder,
        Map<String, String> title,
        Map<String, String> description,
        String url,
        Long imageStoredFileId,
        String imageUrl,
        Long targetPublicationId,
        String targetPublicationUrlPath,
        boolean enabled,
        long version,
        Instant updatedAt
) {
}
