package com.eneml.ajs.editorial.api;

import com.eneml.ajs.submission.api.SubmissionStage;

import java.time.Instant;

public record StageParticipantSummary(
        Long id,
        Long submissionId,
        SubmissionStage stage,
        Long userId,
        StageRole role,
        boolean canChangeMetadata,
        boolean recommendOnly,
        Instant dateAssigned,
        Long assignedByUserId) {
}
