package com.eneml.ajs.review.internal.persistence;

import com.eneml.ajs.review.internal.domain.ReviewRound;
import com.eneml.ajs.submission.api.SubmissionStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRoundRepository extends JpaRepository<ReviewRound, Long> {

    List<ReviewRound> findBySubmissionIdOrderByStageAscRoundNumberAsc(Long submissionId);

    Optional<ReviewRound> findFirstBySubmissionIdAndStageOrderByRoundNumberDesc(
            Long submissionId, SubmissionStage stage);
}
