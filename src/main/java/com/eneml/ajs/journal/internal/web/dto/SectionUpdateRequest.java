package com.eneml.ajs.journal.internal.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * Update payload for a section. {@code code} is intentionally omitted —
 * a section's code is its stable identifier and is not editable.
 */
public record SectionUpdateRequest(

        @PositiveOrZero
        int seq,

        @Positive
        Long reviewFormId,

        boolean editorRestricted,

        boolean metaIndexed,

        boolean metaReviewed,

        boolean abstractsRequired,

        boolean hideTitle,

        boolean hideAuthor,

        @PositiveOrZero
        Integer abstractWordLimit,

        @NotNull @Size(min = 1)
        Map<String, String> title,

        @NotNull
        Map<String, String> abbrev,

        @NotNull
        Map<String, String> policy,

        @NotNull
        Map<String, String> identifyType
) {
}
