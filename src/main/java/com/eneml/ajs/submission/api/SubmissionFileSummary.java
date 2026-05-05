package com.eneml.ajs.submission.api;

import java.time.Instant;

/**
 * Read-only projection of a single uploaded file attached to a
 * submission. {@code storedFileId} is the cross-module handle used to
 * resolve the underlying storage row (filename, content type, size,
 * presigned download URL) via storage::api.
 */
public record SubmissionFileSummary(
        Long id,
        Long submissionId,
        FileStage fileStage,
        Long storedFileId,
        Long uploaderUserId,
        Instant uploadedAt
) {
}
