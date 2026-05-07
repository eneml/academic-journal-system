package com.eneml.ajs.dashboard.api;

/**
 * One row of the per-issue stats card.
 *
 * @param issueId        primary identifier
 * @param identification "Vol. 12 No. 3 (2026)"
 * @param datePublished  ISO instant or null when unpublished
 * @param articles       publications belonging to this issue
 * @param abstractViews  cumulative abstract views across all articles in the issue
 * @param fileViews      cumulative file (PDF/HTML/other) downloads
 * @param totalViews     {@code abstractViews + fileViews}
 */
public record IssueStatsRow(
        long issueId,
        String identification,
        String datePublished,
        long articles,
        long abstractViews,
        long fileViews,
        long totalViews
) {
}
