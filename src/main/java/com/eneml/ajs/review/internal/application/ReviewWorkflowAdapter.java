package com.eneml.ajs.review.internal.application;

import com.eneml.ajs.review.api.ReviewRoundSummary;
import com.eneml.ajs.review.api.ReviewWorkflow;
import com.eneml.ajs.review.internal.web.mapper.ReviewMapper;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionStage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.eneml.ajs.review.internal.persistence.ReviewRoundRepository;

@Component
@RequiredArgsConstructor
class ReviewWorkflowAdapter implements ReviewWorkflow {

    private final ReviewService reviewService;
    private final ReviewRoundRepository roundRepository;
    private final ReviewMapper mapper;

    @Override
    @Transactional
    public ReviewRoundSummary openNextRound(Long submissionId, SubmissionStage stage) {
        return mapper.toSummary(reviewService.openNextRound(submissionId, stage));
    }

    @Override
    @Transactional
    public void cancelRound(Long roundId) {
        var round = roundRepository.findById(roundId).orElseThrow(() ->
                NotFoundException.of("ReviewRound", roundId));
        round.markCancelled();
    }
}
