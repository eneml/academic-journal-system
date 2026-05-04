package com.eneml.ajs.audit.api;

import java.time.Instant;
import java.util.Map;

public record EventLogEntrySummary(
        Long id,
        String eventType,
        Long submissionId,
        Long actorUserId,
        Map<String, Object> payload,
        Instant occurredAt
) {
}
