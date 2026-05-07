package com.eneml.ajs.review.internal.persistence;

import com.eneml.ajs.review.api.ReviewAssignmentStatus;
import com.eneml.ajs.review.internal.domain.ReviewAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ReviewAssignmentRepository extends JpaRepository<ReviewAssignment, Long> {

    List<ReviewAssignment> findByReviewRoundIdOrderByDateAssigned(Long reviewRoundId);

    Optional<ReviewAssignment> findByReviewRoundIdAndReviewerUserId(Long reviewRoundId, Long reviewerUserId);

    @Query("""
            SELECT a FROM ReviewAssignment a
            WHERE a.reviewerUserId = :reviewerUserId
              AND a.status NOT IN (com.eneml.ajs.review.api.ReviewAssignmentStatus.DECLINED,
                                    com.eneml.ajs.review.api.ReviewAssignmentStatus.CANCELLED,
                                    com.eneml.ajs.review.api.ReviewAssignmentStatus.CONFIRMED)
            ORDER BY a.dateAssigned DESC
            """)
    List<ReviewAssignment> findOpenForReviewer(Long reviewerUserId);

    long countByReviewRoundIdAndStatusIn(Long reviewRoundId, List<ReviewAssignmentStatus> statuses);

    long countByReviewRoundId(Long reviewRoundId);

    /**
     * Assignments still in flight (invited, accepted, in-progress) whose
     * response or review deadline has passed. Used by the scheduled
     * reminder sweep.
     */
    @Query("""
            SELECT a FROM ReviewAssignment a
            WHERE a.status IN (com.eneml.ajs.review.api.ReviewAssignmentStatus.AWAITING_RESPONSE,
                                com.eneml.ajs.review.api.ReviewAssignmentStatus.ACCEPTED,
                                com.eneml.ajs.review.api.ReviewAssignmentStatus.IN_PROGRESS)
              AND ((a.dateResponseDue IS NOT NULL AND a.dateResponseDue < :cutoff)
                   OR (a.dateDue IS NOT NULL AND a.dateDue < :cutoff))
            ORDER BY a.dateAssigned ASC
            """)
    List<ReviewAssignment> findOverdue(java.time.Instant cutoff);

    @Query(value = "SELECT COUNT(DISTINCT reviewer_user_id) FROM review_assignment WHERE updated_at >= :since",
            nativeQuery = true)
    long countActiveReviewersSince(java.time.Instant since);
}
