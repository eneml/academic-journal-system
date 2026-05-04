package com.eneml.ajs.publication.api;

import java.time.Instant;

public record DoiSummary(
        Long id,
        String doi,
        DoiStatus status,
        Instant registeredAt,
        String errorMessage
) {
}
