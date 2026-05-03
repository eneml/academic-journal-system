package com.eneml.ajs.journal.internal.web.dto;

import com.eneml.ajs.journal.api.GenreCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record GenreCreateRequest(

        @NotBlank @Size(max = 64)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "code must be kebab-case")
        String code,

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
