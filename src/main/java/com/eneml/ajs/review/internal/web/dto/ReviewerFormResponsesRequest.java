package com.eneml.ajs.review.internal.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ReviewerFormResponsesRequest(
        @NotNull List<Entry> answers) {

    public record Entry(
            @NotNull Long elementId,
            String responseValue) {}
}
