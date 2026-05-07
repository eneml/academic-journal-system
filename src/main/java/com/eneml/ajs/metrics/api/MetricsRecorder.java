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
     * Bump the abstract-page view counter for the given publication. Bumps
     * both the cumulative {@code publication_metrics} row and today's row
     * in {@code publication_metric_daily}.
     */
    void recordView(long publicationId);

    /**
     * Bump the download counter for the given publication. The cumulative
     * row is bumped under the catch-all {@code download_count}; the daily
     * row is bumped under the column matching {@code format} so the admin
     * Statistics page can break out PDF vs HTML vs other-format downloads.
     *
     * @param galleyId galley whose underlying file the user is downloading
     * @param format   coarse format classification (caller derives from label)
     */
    void recordDownload(long publicationId, long galleyId, FormatKind format);
}
