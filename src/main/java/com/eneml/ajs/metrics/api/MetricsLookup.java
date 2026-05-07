package com.eneml.ajs.metrics.api;

import java.time.LocalDate;
import java.util.List;

/**
 * Cross-module read surface for the metrics module.
 */
public interface MetricsLookup {

    /**
     * Get current view / download counters for a single publication. Returns
     * a zeroed summary if the publication has never been viewed or
     * downloaded — call sites don't need to handle null.
     */
    PublicationMetricsSummary getMetrics(long publicationId);

    /**
     * Top {@code limit} publications by view count, descending. Used by the
     * public site for "most read" rankings. Publications with zero views
     * are excluded.
     */
    List<PublicationMetricsSummary> topByViews(int limit);

    /**
     * Time-series buckets between {@code from} and {@code to} inclusive.
     * Each bucket reports abstract views and file views (PDF + HTML +
     * other galley downloads). When {@code monthly} is true the key is
     * {@code YYYY-MM}; otherwise {@code YYYY-MM-DD}.
     */
    List<DailyMetricsBucket> timeseries(LocalDate from, LocalDate to, boolean monthly);

    /**
     * Per-publication totals for the given range. Only publications with
     * at least one event in the window appear in the result.
     */
    List<PublicationMetricsRange> articleTotalsForRange(LocalDate from, LocalDate to);
}
