package com.eneml.ajs.journal.internal.web.dto;

import java.time.Instant;
import java.util.Map;

public record SectionResponse(
        Long id,
        String code,
        int seq,
        Long reviewFormId,
        boolean editorRestricted,
        boolean metaIndexed,
        boolean metaReviewed,
        boolean abstractsRequired,
        boolean hideTitle,
        boolean hideAuthor,
        boolean inactive,
        Integer abstractWordLimit,
        Map<String, String> title,
        Map<String, String> abbrev,
        Map<String, String> policy,
        Map<String, String> identifyType,
        long version,
        Instant updatedAt
) {
}
