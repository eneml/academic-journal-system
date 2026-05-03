package com.eneml.ajs.submission.internal.web.dto;

import com.eneml.ajs.submission.api.FileStage;

import java.time.Instant;
import java.util.Map;

public record SubmissionFileResponse(
        Long id,
        Long submissionId,
        Long storedFileId,
        Long genreId,
        FileStage fileStage,
        Long sourceSubmissionFileId,
        Long uploaderUserId,
        String locale,
        Map<String, String> label,
        Map<String, String> description,
        boolean viewable,
        long version,
        Instant updatedAt,
        // Lifted from StoredFile metadata for client convenience
        String contentType,
        long sizeBytes,
        String originalFilename
) {
}
