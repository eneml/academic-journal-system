package com.eneml.ajs.metrics.api;

import java.time.Instant;

/**
 * Read-only projection of a publication's view / download counters.
 *
 * @param publicationId    publication these counters belong to
 * @param viewCount        cumulative number of public article-page views
 * @param downloadCount    cumulative number of galley-file downloads
 * @param lastViewedAt     timestamp of the most recent view (null if never viewed)
 * @param lastDownloadedAt timestamp of the most recent download (null if never downloaded)
 */
public record PublicationMetricsSummary(
        long publicationId,
        long viewCount,
        long downloadCount,
        Instant lastViewedAt,
        Instant lastDownloadedAt
) {
    /** Empty / never-recorded counters for a publication. */
    public static PublicationMetricsSummary empty(long publicationId) {
        return new PublicationMetricsSummary(publicationId, 0L, 0L, null, null);
    }
}
