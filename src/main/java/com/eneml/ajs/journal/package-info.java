/**
 * Journal module — singleton journal configuration, sections, file genres,
 * masthead. Replaces OJS's per-context (multi-journal) settings with
 * a single configurable journal.
 *
 * <p>Owns: JournalConfig, Section, Genre, MastheadEntry.
 * <br>Emits: SectionCreated, SectionUpdated, GenreCreated, JournalConfigUpdated.
 * <br>Consumes: nothing.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Journal"
)
package com.eneml.ajs.journal;
