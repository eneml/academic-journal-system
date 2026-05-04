package com.eneml.ajs.metrics.internal.application;

import com.eneml.ajs.metrics.api.MetricsLookup;
import com.eneml.ajs.metrics.api.PublicationMetricsSummary;
import com.eneml.ajs.metrics.internal.domain.PublicationMetrics;
import com.eneml.ajs.metrics.internal.persistence.PublicationMetricsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Bridges the metrics module's read API to its persistence layer. Returns a
 * zeroed {@link PublicationMetricsSummary} for publications that have never
 * been viewed, so call sites don't need to handle null.
 */
@Component
@RequiredArgsConstructor
class MetricsLookupAdapter implements MetricsLookup {

    private final PublicationMetricsRepository repository;

    @Override
    @Transactional(readOnly = true)
    public PublicationMetricsSummary getMetrics(long publicationId) {
        return repository.findByPublicationId(publicationId)
                .map(MetricsLookupAdapter::toSummary)
                .orElseGet(() -> PublicationMetricsSummary.empty(publicationId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicationMetricsSummary> topByViews(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        return repository.findTopByViewCount(PageRequest.of(0, safeLimit)).stream()
                .map(MetricsLookupAdapter::toSummary)
                .toList();
    }

    private static PublicationMetricsSummary toSummary(PublicationMetrics m) {
        return new PublicationMetricsSummary(
                m.getPublicationId(),
                m.getViewCount(),
                m.getDownloadCount(),
                m.getLastViewedAt(),
                m.getLastDownloadedAt());
    }
}
