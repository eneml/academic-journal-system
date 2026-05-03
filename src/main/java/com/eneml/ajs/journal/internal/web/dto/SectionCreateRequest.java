package com.eneml.ajs.journal.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record SectionCreateRequest(

        @NotBlank @Size(max = 64)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "code must be kebab-case (lowercase, digits, hyphens)")
        String code,

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
