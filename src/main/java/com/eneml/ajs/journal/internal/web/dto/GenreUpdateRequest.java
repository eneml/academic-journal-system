package com.eneml.ajs.journal.internal.web.dto;

import com.eneml.ajs.journal.api.GenreCategory;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record GenreUpdateRequest(

        @PositiveOrZero
        int seq,

        @NotNull
        GenreCategory category,

        boolean dependent,

        boolean supplementary,

        boolean required,

        @NotNull @Size(min = 1)
        Map<String, String> name
) {
}
