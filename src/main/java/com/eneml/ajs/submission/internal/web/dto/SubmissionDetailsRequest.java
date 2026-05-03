package com.eneml.ajs.submission.internal.web.dto;

import com.eneml.ajs.submission.api.SubmissionProgress;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

public record SubmissionDetailsRequest(

        @NotNull @Size(min = 1)
        Map<String, String> title,

        @NotNull
        Map<String, String> abstractText,

        @NotNull
        List<@Size(max = 128) String> keywords,

        @NotNull
        List<@Size(max = 128) String> disciplines,

        @Size(max = 65536)
        String referencesRaw,

        @Size(max = 16384)
        String commentsToEditor,

        @NotNull
        SubmissionProgress progress
) {
}
