package com.eneml.ajs.editorial.internal.web.dto;

import com.eneml.ajs.editorial.api.DecisionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record TakeDecisionRequest(

        @NotNull
        DecisionType type,

        @Positive
        Long reviewRoundId,

        @Size(max = 8192)
        String summary,

        /**
         * When the wizard supplied user-edited email steps, the listener-driven
         * default email is suppressed and the wizard's content is sent instead.
         * Null or empty falls back to today's listener-driven behaviour.
         */
        @Valid
        List<DecisionEmailOverride> emailOverrides
) {
}
