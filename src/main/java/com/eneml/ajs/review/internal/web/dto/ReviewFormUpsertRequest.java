package com.eneml.ajs.review.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record ReviewFormUpsertRequest(
        @NotBlank @Size(max = 64)
        @Pattern(regexp = "^[a-z][a-zA-Z0-9_-]+$",
                message = "code must start with a lowercase letter and contain only [a-zA-Z0-9_-]")
        String code,

        @NotNull @Size(min = 1)
        Map<String, String> title,

        Map<String, String> description,

        boolean active) {
}
