package com.eneml.ajs.review.api;

import java.time.Instant;

public record ReviewSubmitted(
        Long assignmentId,
        Long submissionId,
        Long reviewerUserId,
        ReviewRecommendation recommendation,
        Instant occurredAt
) {

    public static ReviewSubmitted of(Long assignmentId, Long submissionId,
                                      Long reviewerUserId, ReviewRecommendation recommendation) {
        return new ReviewSubmitted(assignmentId, submissionId, reviewerUserId,
                recommendation, Instant.now());
    }
}
