package com.eneml.ajs.metrics.api;

/**
 * Journal-wide editorial KPIs surfaced on the admin Statistics page.
 * Year-to-date is computed against the JVM's default time zone — fine for a
 * dashboard whose granularity is calendar days.
 *
 * @param submissionsYtd        manuscripts received since 1 Jan of the current year
 * @param articlesPublishedYtd  publications that went live since 1 Jan
 * @param acceptanceRatePct     accepted / (accepted + declined) on closed decisions, rounded percent
 * @param activeReviewers       distinct reviewers with an assignment touched in the last 90 days
 * @param totalDecisions        closed decisions (ACCEPT + DECLINE) considered for the rate
 */
public record StatsOverview(
        long submissionsYtd,
        long articlesPublishedYtd,
        int acceptanceRatePct,
        long activeReviewers,
        long totalDecisions
) {
}
