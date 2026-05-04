package com.eneml.ajs.publication.internal.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

import java.util.Map;

public record GalleyUpsertRequest(

        @Positive
        Long submissionFileId,

        @URL @Size(max = 2048)
        String remoteUrl,

        @Size(min = 2, max = 8)
        String locale,

        @NotNull
        Map<String, String> label,

        @PositiveOrZero
        int seq,

        @Size(max = 255)
        @Pattern(regexp = "^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$",
                message = "url_path must be alphanumeric with . _ -")
        String urlPath
) {
}
