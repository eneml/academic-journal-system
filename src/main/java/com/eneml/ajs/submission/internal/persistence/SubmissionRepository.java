package com.eneml.ajs.submission.internal.persistence;

import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.internal.domain.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface SubmissionRepository
        extends JpaRepository<Submission, Long>, JpaSpecificationExecutor<Submission> {

    Page<Submission> findBySubmittedByUserId(Long userId, Pageable pageable);

    Page<Submission> findByStatusAndStage(SubmissionStatus status, SubmissionStage stage, Pageable pageable);

    Page<Submission> findByStatus(SubmissionStatus status, Pageable pageable);

    List<Submission> findBySubmittedByUserIdAndStatus(Long userId, SubmissionStatus status);
}
