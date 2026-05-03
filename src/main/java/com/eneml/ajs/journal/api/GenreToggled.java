package com.eneml.ajs.journal.api;

import java.time.Instant;

public record GenreToggled(Long genreId, boolean enabled, Instant occurredAt) {

    public static GenreToggled of(Long genreId, boolean enabled) {
        return new GenreToggled(genreId, enabled, Instant.now());
    }
}
