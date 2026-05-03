package com.eneml.ajs.submission.internal.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record SubmissionAuthorUpsertRequest(

        @NotBlank @Size(max = 255)
        String givenName,

        @Size(max = 255)
        String familyName,

        @NotBlank @Email @Size(max = 254)
        String email,

        @Pattern(regexp = "^\\d{4}-\\d{4}-\\d{4}-\\d{3}[\\dX]$",
                message = "ORCID iD must match XXXX-XXXX-XXXX-XXXX")
        String orcidId,

        @Size(max = 512)
        String affiliation,

        @NotNull
        Map<String, String> biography,

        @Size(min = 2, max = 2)
        String country,

        boolean corresponding,

        boolean includeInBrowse,

        Long userId
) {
}
