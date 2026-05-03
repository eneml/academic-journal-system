package com.eneml.ajs.submission.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record SubmissionStartRequest(

        @NotNull @Positive
        Long sectionId,

        @NotBlank @Size(min = 2, max = 8)
        String locale
) {
}
