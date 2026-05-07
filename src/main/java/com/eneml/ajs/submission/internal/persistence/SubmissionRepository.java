package com.eneml.ajs.submission.internal.persistence;

import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.internal.domain.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface SubmissionRepository
        extends JpaRepository<Submission, Long>, JpaSpecificationExecutor<Submission> {

    Page<Submission> findBySubmittedByUserId(Long userId, Pageable pageable);

    Page<Submission> findByStatusAndStage(SubmissionStatus status, SubmissionStage stage, Pageable pageable);

    Page<Submission> findByStatus(SubmissionStatus status, Pageable pageable);

    List<Submission> findBySubmittedByUserIdAndStatus(Long userId, SubmissionStatus status);

    @Query(value = "SELECT COUNT(*) FROM submission WHERE date_submitted >= :since",
            nativeQuery = true)
    long countSubmittedSince(@Param("since") Instant since);

    @Query(value = """
            SELECT EXTRACT(MONTH FROM date_submitted)::int AS m, COUNT(*) AS c
            FROM submission
            WHERE date_submitted IS NOT NULL
              AND EXTRACT(YEAR FROM date_submitted) = :year
            GROUP BY m
            ORDER BY m
            """,
            nativeQuery = true)
    List<Object[]> monthlySubmissionCounts(@Param("year") int year);
}
