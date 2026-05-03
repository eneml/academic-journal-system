package com.eneml.ajs.review.internal.web.dto;

import com.eneml.ajs.review.api.ReviewAssignmentStatus;
import com.eneml.ajs.review.api.ReviewMethod;
import com.eneml.ajs.review.api.ReviewRecommendation;

import java.time.Instant;

public record ReviewAssignmentResponse(
        Long id,
        Long reviewRoundId,
        Long reviewerUserId,
        ReviewMethod reviewMethod,
        ReviewAssignmentStatus status,
        ReviewRecommendation recommendation,
        String commentsToEditor,
        String commentsToAuthor,
        String competingInterests,
        Instant dateAssigned,
        Instant dateResponseDue,
        Instant dateDue,
        Instant dateResponded,
        Instant dateCompleted,
        Instant dateConfirmed,
        Long invitedByUserId,
        long version,
        Instant updatedAt
) {
}
