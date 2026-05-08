package com.eneml.ajs.review.internal.persistence;

import com.eneml.ajs.review.internal.domain.ReviewFormResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewFormResponseRepository extends JpaRepository<ReviewFormResponse, Long> {

    List<ReviewFormResponse> findByReviewAssignmentIdOrderByElementSeqAsc(Long reviewAssignmentId);

    Optional<ReviewFormResponse> findByReviewAssignmentIdAndElementId(
            Long reviewAssignmentId, Long elementId);

    void deleteByReviewAssignmentId(Long reviewAssignmentId);
}
