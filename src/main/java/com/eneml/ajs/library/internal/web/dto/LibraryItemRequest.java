package com.eneml.ajs.library.internal.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record LibraryItemRequest(
        @NotNull @Positive Long publicationId,

        @Size(max = 4000)
        String note
) {
}
