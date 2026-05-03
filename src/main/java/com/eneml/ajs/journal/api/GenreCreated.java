package com.eneml.ajs.journal.api;

import java.time.Instant;

public record GenreCreated(Long genreId, String code, Instant occurredAt) {

    public static GenreCreated of(Long genreId, String code) {
        return new GenreCreated(genreId, code, Instant.now());
    }
}
