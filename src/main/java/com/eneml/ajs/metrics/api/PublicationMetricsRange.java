package com.eneml.ajs.metrics.api;

/**
 * Aggregated counters for one publication over an arbitrary date range.
 * Used by the admin Statistics → Articles table where each row breaks the
 * range total down by surface and format.
 */
public record PublicationMetricsRange(
        long publicationId,
        long abstractViews,
        long pdfViews,
        long htmlViews,
        long otherViews
) {
    public long fileViews() {
        return pdfViews + htmlViews + otherViews;
    }

    public long total() {
        return abstractViews + fileViews();
    }
}
