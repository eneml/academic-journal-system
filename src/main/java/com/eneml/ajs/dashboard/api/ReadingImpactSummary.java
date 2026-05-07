package com.eneml.ajs.dashboard.api;

/**
 * Aggregated reader-engagement totals for the Reading & Impact card.
 *
 * @param totalAbstractViews abstract-page hits across all publications, all time
 * @param totalFileViews     PDF + HTML + other galley downloads, all time
 * @param totalCitations     external citation count (Crossref backed). Zero
 *                            until the integration crawl lands.
 * @param twoYearImpactFactor citations to articles published in the previous
 *                            two years, divided by the count of those articles.
 *                            Null when the journal has no qualifying articles.
 */
public record ReadingImpactSummary(
        long totalAbstractViews,
        long totalFileViews,
        long totalCitations,
        Double twoYearImpactFactor
) {
}
