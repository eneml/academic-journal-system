package com.eneml.ajs.journal.api;

import java.time.Instant;

public record SectionUpdated(Long sectionId, Instant occurredAt) {

    public static SectionUpdated of(Long sectionId) {
        return new SectionUpdated(sectionId, Instant.now());
    }
}
