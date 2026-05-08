package com.eneml.ajs.review.internal.web.dto;

import com.eneml.ajs.review.api.ReviewFormElementType;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record ReviewFormElementUpsertRequest(
        @NotNull ReviewFormElementType elementType,
        boolean included,
        boolean required,
        @NotNull Map<String, String> question,
        Map<String, String> description,
        List<Map<String, Object>> possibleResponses) {
}
