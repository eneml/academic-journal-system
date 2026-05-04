package com.eneml.ajs.metrics.api;

/**
 * Cross-module write surface for the metrics module. Called by the
 * publication module on every public article view and galley-download URL
 * issuance. Implementations must be safe to call from a {@code GET} request
 * handler — i.e. fast, idempotent on its own contract (a duplicate call
 * simply bumps the counter twice), and never throws on a transient DB error
 * (failed counts shouldn't break the page render).
 */
public interface MetricsRecorder {

    /**
     * Bump the view counter for the given publication. The publication's
     * metrics row is created lazily on the first call.
     */
    void recordView(long publicationId);

    /**
     * Bump the download counter for the given publication.
     *
     * @param galleyId galley whose underlying file the user is downloading;
     *                 currently informational only (we don't break out
     *                 per-galley counters yet) but reserved for future
     *                 expansion.
     */
    void recordDownload(long publicationId, long galleyId);
}
