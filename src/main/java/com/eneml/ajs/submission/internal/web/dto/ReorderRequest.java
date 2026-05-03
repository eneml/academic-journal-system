package com.eneml.ajs.submission.internal.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record ReorderRequest(

        @NotNull @NotEmpty
        List<@NotNull @Positive Long> orderedIds
) {
}
