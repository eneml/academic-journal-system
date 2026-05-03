package com.eneml.ajs.submission.internal.persistence;

import com.eneml.ajs.submission.internal.domain.SubmissionAuthor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SubmissionAuthorRepository extends JpaRepository<SubmissionAuthor, Long> {

    @Query("SELECT a FROM SubmissionAuthor a WHERE a.submissionId = :submissionId ORDER BY a.seq, a.id")
    List<SubmissionAuthor> findBySubmissionId(Long submissionId);

    long countBySubmissionId(Long submissionId);

    boolean existsBySubmissionIdAndCorrespondingTrue(Long submissionId);
}
