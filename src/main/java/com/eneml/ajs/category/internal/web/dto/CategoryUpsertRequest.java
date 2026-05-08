package com.eneml.ajs.category.internal.web.dto;

import com.eneml.ajs.category.api.CategorySortOption;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CategoryUpsertRequest(
        @NotBlank @Size(max = 64)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "code must be kebab-case")
        String code,

        @NotBlank @Size(max = 255)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "path must be kebab-case")
        String path,

        @Positive
        Long parentId,

        @NotNull @Size(min = 1)
        Map<String, String> title,

        Map<String, String> description,

        CategorySortOption sortOption,

        @Positive
        Long imageFileId) {
}
