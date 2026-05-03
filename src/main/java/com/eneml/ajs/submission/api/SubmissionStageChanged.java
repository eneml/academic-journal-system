package com.eneml.ajs.submission.api;

import java.time.Instant;

public record SubmissionStageChanged(
        Long submissionId,
        SubmissionStage previousStage,
        SubmissionStage newStage,
        SubmissionStatus newStatus,
        Instant occurredAt
) {

    public static SubmissionStageChanged of(Long submissionId,
                                            SubmissionStage previousStage,
                                            SubmissionStage newStage,
                                            SubmissionStatus newStatus) {
        return new SubmissionStageChanged(submissionId, previousStage, newStage, newStatus, Instant.now());
    }
}
