package com.eneml.ajs.journal.api;

import java.util.Map;

/**
 * Read-only projection of a file genre. Returned by {@link GenreLookup} to
 * other modules (e.g. submission validating that an uploaded file's genre
 * is enabled and matches its category).
 */
public record GenreSummary(
        Long id,
        String code,
        int seq,
        boolean enabled,
        GenreCategory category,
        boolean dependent,
        boolean supplementary,
        boolean required,
        Map<String, String> name
) {
}
