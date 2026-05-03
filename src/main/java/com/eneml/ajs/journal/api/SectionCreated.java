package com.eneml.ajs.journal.api;

import java.time.Instant;

public record SectionCreated(Long sectionId, String code, Instant occurredAt) {

    public static SectionCreated of(Long sectionId, String code) {
        return new SectionCreated(sectionId, code, Instant.now());
    }
}
