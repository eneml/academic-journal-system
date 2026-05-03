package com.eneml.ajs.review.internal.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewerResponseRequest(

        @NotNull
        Boolean accept,

        @Size(max = 4096)
        String message
) {
}
