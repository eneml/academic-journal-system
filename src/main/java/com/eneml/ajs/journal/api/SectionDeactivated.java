package com.eneml.ajs.journal.api;

import java.time.Instant;

public record SectionDeactivated(Long sectionId, Instant occurredAt) {

    public static SectionDeactivated of(Long sectionId) {
        return new SectionDeactivated(sectionId, Instant.now());
    }
}
