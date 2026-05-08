package com.eneml.ajs.scheduling.api;

import java.time.Instant;

/**
 * Fired by the monthly digest job for every editor / admin so the
 * messaging module can render and dispatch the reminder mail.
 */
public record EditorialReminderDue(Long recipientUserId, Instant occurredAt) {

    public static EditorialReminderDue of(Long recipientUserId) {
        return new EditorialReminderDue(recipientUserId, Instant.now());
    }
}
