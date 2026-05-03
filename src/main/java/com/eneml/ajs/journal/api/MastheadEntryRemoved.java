package com.eneml.ajs.journal.api;

import java.time.Instant;

public record MastheadEntryRemoved(Long entryId, Instant occurredAt) {

    public static MastheadEntryRemoved of(Long entryId) {
        return new MastheadEntryRemoved(entryId, Instant.now());
    }
}
