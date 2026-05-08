package com.eneml.ajs.review.internal.web.dto;

import java.util.List;
import java.util.Map;

public record ReviewFormResponse(
        Long id,
        String code,
        Map<String, String> title,
        Map<String, String> description,
        boolean active,
        int completeCount,
        List<ReviewFormElementResponse> elements) {
}
