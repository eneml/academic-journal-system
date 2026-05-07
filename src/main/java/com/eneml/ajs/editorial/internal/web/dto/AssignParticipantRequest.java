package com.eneml.ajs.editorial.internal.web.dto;

import com.eneml.ajs.editorial.api.StageRole;
import com.eneml.ajs.submission.api.SubmissionStage;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AssignParticipantRequest(
        @NotNull SubmissionStage stage,
        @NotNull @Positive Long userId,
        @NotNull StageRole role,
        boolean canChangeMetadata,
        boolean recommendOnly) {
}
