package com.eneml.ajs.review.internal.web.dto;

import com.eneml.ajs.review.api.ReviewRecommendation;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewSubmissionRequest(

        @NotNull
        ReviewRecommendation recommendation,

        @Size(max = 65536)
        String commentsToEditor,

        @Size(max = 65536)
        String commentsToAuthor,

        @Size(max = 4096)
        String competingInterests
) {
}
