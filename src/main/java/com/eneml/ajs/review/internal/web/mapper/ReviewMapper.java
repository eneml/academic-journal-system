package com.eneml.ajs.review.internal.web.mapper;

import com.eneml.ajs.review.api.ReviewAssignmentSummary;
import com.eneml.ajs.review.api.ReviewRoundSummary;
import com.eneml.ajs.review.internal.domain.ReviewAssignment;
import com.eneml.ajs.review.internal.domain.ReviewRound;
import com.eneml.ajs.review.internal.web.dto.ReviewAssignmentResponse;
import com.eneml.ajs.review.internal.web.dto.ReviewRoundResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper
public interface ReviewMapper {

    ReviewRoundResponse toResponse(ReviewRound entity);

    List<ReviewRoundResponse> toRoundResponses(List<ReviewRound> entities);

    ReviewRoundSummary toSummary(ReviewRound entity);

    List<ReviewRoundSummary> toRoundSummaries(List<ReviewRound> entities);

    ReviewAssignmentResponse toResponse(ReviewAssignment entity);

    List<ReviewAssignmentResponse> toAssignmentResponses(List<ReviewAssignment> entities);

    @Mapping(target = "submissionId", ignore = true)
    ReviewAssignmentSummary toSummary(ReviewAssignment entity);

    /**
     * Builds an assignment summary enriched with the submission id from
     * the parent round (the entity carries reviewRoundId, not
     * submissionId, so we wire it explicitly).
     */
    default ReviewAssignmentSummary toSummary(ReviewAssignment entity, Long submissionId) {
        return new ReviewAssignmentSummary(
                entity.getId(),
                entity.getReviewRoundId(),
                submissionId,
                entity.getReviewerUserId(),
                entity.getReviewMethod(),
                entity.getStatus(),
                entity.getRecommendation(),
                entity.getDateAssigned(),
                entity.getDateResponseDue(),
                entity.getDateDue(),
                entity.getDateCompleted());
    }
}
