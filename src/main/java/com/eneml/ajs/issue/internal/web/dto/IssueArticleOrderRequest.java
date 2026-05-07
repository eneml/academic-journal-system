package com.eneml.ajs.issue.internal.web.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Body for {@code PATCH /api/v1/issues/{id}/articles}. The {@code order} list
 * defines the new dense [0..n) display order for the publications it names —
 * see {@link com.eneml.ajs.publication.api.PublicationOrderService#reorderInIssue}.
 */
public record IssueArticleOrderRequest(
        @NotEmpty List<Long> order
) {
}
