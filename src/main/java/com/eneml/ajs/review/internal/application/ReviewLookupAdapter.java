package com.eneml.ajs.review.internal.application;

import com.eneml.ajs.review.api.ReviewAssignmentSummary;
import com.eneml.ajs.review.api.ReviewLookup;
import com.eneml.ajs.review.api.ReviewRoundSummary;
import com.eneml.ajs.review.internal.persistence.ReviewAssignmentRepository;
import com.eneml.ajs.review.internal.persistence.ReviewRoundRepository;
import com.eneml.ajs.review.internal.web.mapper.ReviewMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class ReviewLookupAdapter implements ReviewLookup {

    private final ReviewRoundRepository roundRepository;
    private final ReviewAssignmentRepository assignmentRepository;
    private final ReviewMapper mapper;

    @Override
    public List<ReviewRoundSummary> roundsOf(Long submissionId) {
        return mapper.toRoundSummaries(
                roundRepository.findBySubmissionIdOrderByStageAscRoundNumberAsc(submissionId));
    }

    @Override
    public Optional<ReviewRoundSummary> latestRound(Long submissionId) {
        return roundsOf(submissionId).stream().reduce((a, b) -> b);
    }

    @Override
    public List<ReviewAssignmentSummary> assignmentsForRound(Long roundId) {
        Long submissionId = roundRepository.findById(roundId)
                .map(r -> r.getSubmissionId()).orElse(null);
        return assignmentRepository.findByReviewRoundIdOrderByDateAssigned(roundId).stream()
                .map(a -> mapper.toSummary(a, submissionId))
                .toList();
    }

    @Override
    public List<ReviewAssignmentSummary> openAssignmentsForReviewer(Long reviewerUserId) {
        return inflate(assignmentRepository.findOpenForReviewer(reviewerUserId));
    }

    @Override
    public List<ReviewAssignmentSummary> overdueAssignments(Instant cutoff) {
        return inflate(assignmentRepository.findOverdue(cutoff));
    }

    private List<ReviewAssignmentSummary> inflate(
            List<com.eneml.ajs.review.internal.domain.ReviewAssignment> assignments) {
        // Bulk-fetch parent rounds to avoid N+1.
        Map<Long, Long> roundToSubmission = roundRepository.findAllById(
                assignments.stream().map(a -> a.getReviewRoundId()).distinct().toList())
                .stream()
                .collect(Collectors.toMap(r -> r.getId(), r -> r.getSubmissionId(), (a, b) -> a));
        return assignments.stream()
                .map(a -> mapper.toSummary(a, roundToSubmission.get(a.getReviewRoundId())))
                .toList();
    }
}
