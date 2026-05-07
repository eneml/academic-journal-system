package com.eneml.ajs.journal.internal.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

import java.util.Map;
import java.util.Set;

public record JournalConfigUpdateRequest(

        @NotNull @Size(min = 1)
        Map<String, String> name,

        @Pattern(regexp = "^\\d{4}-\\d{3}[\\dxX]$",
                message = "ISSN must match XXXX-XXXX (last char may be 0-9 or X)")
        String issnPrint,

        @Pattern(regexp = "^\\d{4}-\\d{3}[\\dxX]$",
                message = "ISSN must match XXXX-XXXX (last char may be 0-9 or X)")
        String issnOnline,

        @NotBlank @Size(min = 2, max = 8)
        String defaultLocale,

        @NotEmpty
        Set<@NotBlank @Size(min = 2, max = 8) String> supportedLocales,

        @Email @Size(max = 254)
        String contactEmail,

        @NotNull
        Map<String, String> mastheadText,

        @NotNull
        Map<String, String> copyrightNotice,

        @URL @Size(max = 2048)
        String licenseUrl,

        @NotNull
        Map<String, String> about,

        boolean submissionsOpen,

        @Size(max = 32)
        String acronym,

        @NotNull
        Map<String, String> subtitle,

        @Min(1500) @Max(9999)
        Integer foundingYear,

        @Size(max = 64)
        String frequency,

        @Size(max = 256)
        String publisher,

        @Pattern(regexp = "^[A-Z]{2}$",
                message = "Country must be a 2-letter ISO 3166-1 code (e.g. RO, GB, US)")
        String countryOfPublication
) {
}
