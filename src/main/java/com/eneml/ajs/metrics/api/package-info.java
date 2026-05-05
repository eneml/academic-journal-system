/**
 * Public API of the {@code metrics} module — the only types other
 * modules may reference. Holds:
 * <ul>
 *   <li>{@code MetricsRecorder} — write surface called by the publication
 *       module on every public read/download.</li>
 *   <li>{@code MetricsLookup} — read surface for cross-module summary
 *       queries.</li>
 *   <li>{@code PublicationMetricsSummary} — value type returned by lookups.</li>
 * </ul>
 */
@org.springframework.modulith.NamedInterface("api")
package com.eneml.ajs.metrics.api;
