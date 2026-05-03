package com.eneml.ajs.review.api;

import java.util.List;
import java.util.Optional;

public interface ReviewLookup {

    List<ReviewRoundSummary> roundsOf(Long submissionId);

    Optional<ReviewRoundSummary> latestRound(Long submissionId);

    List<ReviewAssignmentSummary> assignmentsForRound(Long roundId);

    List<ReviewAssignmentSummary> openAssignmentsForReviewer(Long reviewerUserId);
}
