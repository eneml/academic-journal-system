package com.eneml.ajs.submission.api;

import java.time.Instant;

public record SubmissionFileUploaded(
        Long submissionId,
        Long submissionFileId,
        Long storedFileId,
        FileStage fileStage,
        Long uploaderUserId,
        Instant occurredAt
) {

    public static SubmissionFileUploaded of(Long submissionId, Long submissionFileId,
                                             Long storedFileId, FileStage fileStage,
                                             Long uploaderUserId) {
        return new SubmissionFileUploaded(submissionId, submissionFileId, storedFileId,
                fileStage, uploaderUserId, Instant.now());
    }
}
