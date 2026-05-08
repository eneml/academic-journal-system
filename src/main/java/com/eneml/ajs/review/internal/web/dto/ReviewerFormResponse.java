package com.eneml.ajs.review.internal.web.dto;

import java.util.List;
import java.util.Map;

/**
 * Reviewer-facing payload: the form bound to their assignment's section
 * plus any responses they've already saved (so they can resume an
 * in-progress review).
 *
 * <p>{@code present=false} means the section has no review form bound;
 * the reviewer's UI should fall back to the freetext-only review screen.
 */
public record ReviewerFormResponse(
        boolean present,
        Long formId,
        Map<String, String> title,
        Map<String, String> description,
        List<ReviewFormElementResponse> elements,
        List<ReviewerFormAnswer> answers) {

    public record ReviewerFormAnswer(Long elementId, String responseValue) {}
}
