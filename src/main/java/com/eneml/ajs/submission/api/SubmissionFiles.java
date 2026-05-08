package com.eneml.ajs.submission.api;

import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * Cross-module write port for attaching files to a submission. Other modules
 * (currently {@code review}) need to upload reviewer attachments scoped to a
 * submission without reaching into submission-internal services.
 *
 * <p>Reads can stay on {@link SubmissionLookup#filesOf(Long)}; this port only
 * covers the upload / delete / per-file lookup paths used by external
 * modules.
 */
public interface SubmissionFiles {

    SubmissionFileSummary upload(Long submissionId,
                                 FileStage fileStage,
                                 Long genreId,
                                 InputStream content,
                                 String contentType,
                                 String originalFilename,
                                 String locale,
                                 Long uploaderUserId);

    Optional<SubmissionFileSummary> findById(Long fileId);

    List<SubmissionFileSummary> listByStage(Long submissionId, FileStage fileStage);

    /**
     * Mints a presigned download URL for a previously uploaded file. The
     * URL is short-lived; the caller is expected to redirect the user
     * straight to it.
     */
    URI downloadUrl(Long fileId, Duration ttl);

    void delete(Long submissionId, Long fileId);
}
