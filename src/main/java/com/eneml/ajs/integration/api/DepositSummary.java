package com.eneml.ajs.integration.api;

import java.time.Instant;

public record DepositSummary(
        Long id,
        DepositTarget target,
        DepositSubject subjectType,
        Long subjectId,
        String externalRef,
        DepositStatus status,
        int attempts,
        Instant lastAttemptAt,
        Instant completedAt,
        String errorMessage
) {
}
