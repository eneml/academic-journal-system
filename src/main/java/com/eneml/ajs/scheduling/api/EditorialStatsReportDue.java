package com.eneml.ajs.scheduling.api;

import java.time.Instant;

/**
 * Fired by the monthly statistics-report job for every admin user.
 */
public record EditorialStatsReportDue(
        Long recipientUserId,
        long submissionsYtd,
        long articlesPublishedYtd,
        int acceptanceRatePct,
        long activeReviewers,
        long totalDecisions,
        Instant occurredAt
) {

    public static EditorialStatsReportDue of(Long recipientUserId,
                                              long submissionsYtd,
                                              long articlesPublishedYtd,
                                              int acceptanceRatePct,
                                              long activeReviewers,
                                              long totalDecisions) {
        return new EditorialStatsReportDue(recipientUserId, submissionsYtd, articlesPublishedYtd,
                acceptanceRatePct, activeReviewers, totalDecisions, Instant.now());
    }
}
