package com.eneml.ajs.journal.internal.web.dto;

import com.eneml.ajs.journal.api.GenreCategory;

import java.time.Instant;
import java.util.Map;

public record GenreResponse(
        Long id,
        String code,
        int seq,
        boolean enabled,
        GenreCategory category,
        boolean dependent,
        boolean supplementary,
        boolean required,
        Map<String, String> name,
        long version,
        Instant updatedAt
) {
}
