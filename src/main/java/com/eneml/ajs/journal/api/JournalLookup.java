package com.eneml.ajs.journal.api;

/**
 * Read-only access to the singleton journal configuration for other modules.
 * Implementations cache aggressively — the config changes rarely.
 */
public interface JournalLookup {

    JournalConfigSummary getConfig();
}
