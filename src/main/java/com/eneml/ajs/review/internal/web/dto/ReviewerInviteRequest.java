package com.eneml.ajs.review.internal.web.dto;

import com.eneml.ajs.review.api.ReviewMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;

public record ReviewerInviteRequest(

        @NotNull @Positive
        Long reviewerUserId,

        @NotNull
        ReviewMethod reviewMethod,

        Instant dateResponseDue,

        Instant dateDue
) {
}
