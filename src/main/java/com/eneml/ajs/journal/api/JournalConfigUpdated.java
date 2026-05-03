package com.eneml.ajs.journal.api;

import java.time.Instant;

/**
 * Emitted when the singleton journal configuration is changed. Carries no
 * payload — listeners that need the new state should look it up via
 * {@link JournalLookup} (with their own cache invalidation behavior).
 */
public record JournalConfigUpdated(Instant occurredAt) {

    public static JournalConfigUpdated now() {
        return new JournalConfigUpdated(Instant.now());
    }
}
