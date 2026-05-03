package com.eneml.ajs.editorial.internal.web.dto;

import com.eneml.ajs.editorial.api.DecisionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record TakeDecisionRequest(

        @NotNull
        DecisionType type,

        @Positive
        Long reviewRoundId,

        @Size(max = 8192)
        String summary
) {
}
