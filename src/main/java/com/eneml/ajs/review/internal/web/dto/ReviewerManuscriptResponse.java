package com.eneml.ajs.review.internal.web.dto;

import com.eneml.ajs.submission.api.FileStage;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Blinded manuscript view served to a reviewer alongside their assignment.
 * Mirrors {@link com.eneml.ajs.submission.api.SubmissionContent} but adds
 * the file list (with presigned download URLs) so the reviewer can read
 * the manuscript without ever seeing the author identity. Author name,
 * email, ORCID, affiliation, and the submitter's user id are deliberately
 * omitted regardless of review method.
 */
public record ReviewerManuscriptResponse(
        Long submissionId,
        Long assignmentId,
        String reviewMethod,
        String locale,
        Map<String, String> title,
        Map<String, String> abstractText,
        List<String> keywords,
        List<File> files
) {

    public record File(
            Long id,
            FileStage stage,
            String filename,
            String contentType,
            long sizeBytes,
            String downloadUrl,
            Instant uploadedAt
    ) {
    }
}
