package com.eneml.ajs.metrics.internal.web;

import com.eneml.ajs.metrics.api.MetricsLookup;
import com.eneml.ajs.metrics.api.PublicationMetricsSummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public read-only metrics surface. Counters are not sensitive — both the
 * editorial and public sites can show them — so these endpoints are wired
 * into the {@code permitAll} GET allow-list in
 * {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Metrics")
class MetricsController {

    private final MetricsLookup lookup;

    @GetMapping("/publications/{publicationId}/metrics")
    @Operation(summary = "Per-publication view + download counters")
    PublicationMetricsSummary metricsForPublication(@PathVariable long publicationId) {
        return lookup.getMetrics(publicationId);
    }

    @GetMapping("/metrics/top-viewed")
    @Operation(summary = "Top publications by cumulative view count")
    List<PublicationMetricsSummary> topViewed(
            @RequestParam(defaultValue = "10") int limit) {
        return lookup.topByViews(limit);
    }
}
