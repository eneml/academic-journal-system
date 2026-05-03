package com.eneml.ajs.submission.api;

import java.time.Instant;

public record SubmissionStarted(Long submissionId, Long submittedByUserId, Instant occurredAt) {

    public static SubmissionStarted of(Long submissionId, Long submittedByUserId) {
        return new SubmissionStarted(submissionId, submittedByUserId, Instant.now());
    }
}
