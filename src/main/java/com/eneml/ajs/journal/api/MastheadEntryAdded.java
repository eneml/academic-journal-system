package com.eneml.ajs.journal.api;

import java.time.Instant;

public record MastheadEntryAdded(Long entryId, Long userId, Instant occurredAt) {

    public static MastheadEntryAdded of(Long entryId, Long userId) {
        return new MastheadEntryAdded(entryId, userId, Instant.now());
    }
}
