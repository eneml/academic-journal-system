package com.eneml.ajs.metrics.api;

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
}
