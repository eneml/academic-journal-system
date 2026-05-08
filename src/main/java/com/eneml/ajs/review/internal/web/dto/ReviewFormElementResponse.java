package com.eneml.ajs.review.internal.web.dto;

import com.eneml.ajs.review.api.ReviewFormElementType;

import java.util.List;
import java.util.Map;

public record ReviewFormElementResponse(
        Long id,
        int seq,
        ReviewFormElementType elementType,
        boolean included,
        boolean required,
        Map<String, String> question,
        Map<String, String> description,
        List<Map<String, Object>> possibleResponses) {
}
