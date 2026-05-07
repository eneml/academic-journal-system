package com.eneml.ajs.editorial.internal.web.dto;

import com.eneml.ajs.editorial.api.DecisionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DecisionPreviewRequest(
        @NotNull DecisionType type,
        @Positive Long reviewRoundId) {
}
