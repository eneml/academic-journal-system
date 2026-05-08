package com.eneml.ajs.submission.internal.persistence;

import com.eneml.ajs.submission.api.FileStage;
import com.eneml.ajs.submission.internal.domain.SubmissionFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SubmissionFileRepository extends JpaRepository<SubmissionFile, Long> {

    @Query("SELECT f FROM SubmissionFile f WHERE f.submissionId = :submissionId ORDER BY f.fileStage, f.id")
    List<SubmissionFile> findBySubmissionId(Long submissionId);

    @Query("""
            SELECT f FROM SubmissionFile f
            WHERE f.submissionId = :submissionId AND f.fileStage = :fileStage
            ORDER BY f.id
            """)
    List<SubmissionFile> findBySubmissionIdAndFileStage(Long submissionId, FileStage fileStage);

    @Query("""
            SELECT f FROM SubmissionFile f
            WHERE f.parentSubmissionFileId = :parentFileId
            ORDER BY f.id
            """)
    List<SubmissionFile> findByParentSubmissionFileId(Long parentFileId);
}
