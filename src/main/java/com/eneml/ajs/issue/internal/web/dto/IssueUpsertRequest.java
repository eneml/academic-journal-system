package com.eneml.ajs.issue.internal.web.dto;

import com.eneml.ajs.publication.api.AccessStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record IssueUpsertRequest(

        @Positive
        Integer volume,

        @Size(max = 32)
        String number,

        @Positive
        Integer year,

        @NotNull
        Map<String, String> title,

        @NotNull
        Map<String, String> description,

        @Size(max = 2048)
        String coverImagePath,

        @Size(max = 255)
        @Pattern(regexp = "^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$",
                message = "url_path must be alphanumeric with . _ -")
        String urlPath,

        boolean showVolume,
        boolean showNumber,
        boolean showYear,
        boolean showTitle,

        @NotNull
        AccessStatus accessStatus
) {
}
