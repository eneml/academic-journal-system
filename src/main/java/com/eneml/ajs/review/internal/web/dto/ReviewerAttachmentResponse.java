package com.eneml.ajs.review.internal.web.dto;

import java.time.Instant;

/**
 * Reviewer-side projection of a {@code REVIEW_ATTACHMENT} file the reviewer
 * uploaded against their own assignment. Carries a presigned download URL
 * directly so the UI doesn't need a follow-up round-trip.
 */
public record ReviewerAttachmentResponse(
        Long id,
        Long submissionId,
        String originalFilename,
        String contentType,
        long sizeBytes,
        String downloadUrl,
        Instant uploadedAt
) {
}
