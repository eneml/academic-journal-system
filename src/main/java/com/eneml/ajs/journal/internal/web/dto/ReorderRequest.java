package com.eneml.ajs.journal.internal.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

/**
 * Reorder operation: the IDs in {@code orderedIds} are assigned ascending
 * {@code seq}/{@code displayOrder} values starting at 10 with stride 10.
 * Stride is intentional so an admin can later squeeze in a new item by
 * setting its seq between two existing ones without re-sequencing all.
 */
public record ReorderRequest(

        @NotNull @NotEmpty
        List<@NotNull @Positive Long> orderedIds
) {
}
