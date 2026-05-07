package com.eneml.ajs.dashboard.api;

/**
 * One row in the admin Statistics → Articles table. Joins per-publication
 * metric totals with the publication's title and a short author byline so
 * the frontend can render OJS-style entries like "Firat et al. — Consumption…".
 *
 * @param publicationId   primary identifier
 * @param title           publication title in the admin user's locale (best-effort)
 * @param authorByline    "Smith et al." style attribution; null when no authors
 * @param abstractViews   abstract-page hits in the inspected window
 * @param fileViews       PDF + HTML + other downloads
 * @param pdfViews        PDF galley downloads only
 * @param htmlViews       HTML/XML galley downloads only
 * @param otherViews      every other galley format
 * @param total           {@code abstractViews + fileViews}
 */
public record ArticleStatsRow(
        long publicationId,
        String title,
        String authorByline,
        long abstractViews,
        long fileViews,
        long pdfViews,
        long htmlViews,
        long otherViews,
        long total
) {
}
