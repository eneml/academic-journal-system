package com.eneml.ajs.review.internal.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ReviewFormElementReorderRequest(
        @NotNull @NotEmpty List<Long> orderedElementIds) {
}
