package com.eneml.ajs.issue.internal.web.dto;

import com.eneml.ajs.publication.api.AccessStatus;

import java.time.Instant;
import java.util.Map;

public record IssueResponse(
        Long id,
        Integer volume,
        String number,
        Integer year,
        Map<String, String> title,
        Map<String, String> description,
        String coverImagePath,
        String urlPath,
        boolean showVolume,
        boolean showNumber,
        boolean showYear,
        boolean showTitle,
        boolean published,
        Instant datePublished,
        AccessStatus accessStatus,
        Instant openAccessDate,
        long version,
        Instant updatedAt
) {
}
