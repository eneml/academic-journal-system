package com.eneml.ajs.journal.internal.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record MastheadEntryUpsertRequest(

        @NotNull @Positive
        Long userId,

        @NotNull @Size(min = 1)
        Map<String, String> roleLabel,

        @NotNull
        Map<String, String> bioOverride,

        @PositiveOrZero
        int displayOrder,

        boolean visible
) {
}
