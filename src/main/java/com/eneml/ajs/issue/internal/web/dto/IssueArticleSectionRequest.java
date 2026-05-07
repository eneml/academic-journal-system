package com.eneml.ajs.issue.internal.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Body for moving a publication between sections inside an issue. */
public record IssueArticleSectionRequest(
        @NotNull @Positive Long sectionId
) {
}
