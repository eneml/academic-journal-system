package com.eneml.ajs.submission.api;

import java.time.Instant;

public record SubmissionSubmitted(
        Long submissionId,
        Long sectionId,
        Long submittedByUserId,
        Instant occurredAt
) {

    public static SubmissionSubmitted of(Long submissionId, Long sectionId, Long submittedByUserId) {
        return new SubmissionSubmitted(submissionId, sectionId, submittedByUserId, Instant.now());
    }
}
