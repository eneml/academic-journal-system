package com.eneml.ajs.library.internal.web.dto;

import java.time.Instant;

public record LibraryItemResponse(
        Long id,
        Long publicationId,
        Instant savedAt,
        String note
) {
}
