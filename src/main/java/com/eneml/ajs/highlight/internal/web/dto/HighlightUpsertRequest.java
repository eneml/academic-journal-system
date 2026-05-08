package com.eneml.ajs.highlight.internal.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record HighlightUpsertRequest(
        int sortOrder,

        @NotNull
        Map<String, String> title,

        @NotNull
        Map<String, String> description,

        @Size(max = 2048)
        String url,

        Long imageStoredFileId,

        Long targetPublicationId,

        boolean enabled
) {
}
