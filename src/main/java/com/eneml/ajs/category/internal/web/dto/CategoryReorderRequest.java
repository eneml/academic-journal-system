package com.eneml.ajs.category.internal.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CategoryReorderRequest(
        Long parentId,
        @NotNull @NotEmpty List<Long> orderedIds) {
}
