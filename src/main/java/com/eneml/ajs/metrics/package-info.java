/**
 * Metrics module — per-publication view and download counters surfaced on
 * the article page (and used by the homepage for "most read" ranking).
 *
 * <p>Counters are bumped by the publication module via the
 * {@link com.eneml.ajs.metrics.api.MetricsRecorder} interface every time a
 * public article view or galley download URL is served. The increment is a
 * single atomic SQL UPDATE so concurrent reads can never race the counter.
 *
 * <p>Owns: PublicationMetrics.
 * <br>Emits: nothing.
 * <br>Consumes: nothing (publication module calls in via api).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Metrics",
    allowedDependencies = { "shared" }
)
package com.eneml.ajs.metrics;
