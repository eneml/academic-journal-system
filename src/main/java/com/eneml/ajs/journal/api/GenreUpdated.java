package com.eneml.ajs.journal.api;

import java.time.Instant;

public record GenreUpdated(Long genreId, Instant occurredAt) {

    public static GenreUpdated of(Long genreId) {
        return new GenreUpdated(genreId, Instant.now());
    }
}
