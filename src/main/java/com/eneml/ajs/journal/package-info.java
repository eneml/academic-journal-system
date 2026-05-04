/**
 * Journal module — single-journal configuration and the catalogue admins
 * curate: editorial sections, file genres, and the masthead listing.
 *
 * <p>Owns: JournalConfig (singleton), Section, Genre, MastheadEntry.
 * <br>Emits: SectionCreated, SectionUpdated, GenreCreated, JournalConfigUpdated.
 * <br>Consumes: identity::api (used to enrich masthead entries with user info).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Journal",
    allowedDependencies = { "shared", "identity::api" }
)
package com.eneml.ajs.journal;
