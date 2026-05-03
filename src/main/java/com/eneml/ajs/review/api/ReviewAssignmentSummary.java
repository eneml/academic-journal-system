package com.eneml.ajs.review.api;

import java.time.Instant;

public record ReviewAssignmentSummary(
        Long id,
        Long reviewRoundId,
        Long submissionId,
        Long reviewerUserId,
        ReviewMethod reviewMethod,
        ReviewAssignmentStatus status,
        ReviewRecommendation recommendation,
        Instant dateAssigned,
        Instant dateResponseDue,
        Instant dateDue,
        Instant dateCompleted
) {
}
