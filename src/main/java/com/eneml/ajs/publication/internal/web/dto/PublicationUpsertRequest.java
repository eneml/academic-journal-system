package com.eneml.ajs.publication.internal.web.dto;

import com.eneml.ajs.publication.api.AccessStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

import java.util.List;
import java.util.Map;

public record PublicationUpsertRequest(

        @NotNull
        AccessStatus accessStatus,

        @Positive
        Long sectionId,

        Long issueId,

        @Email @Size(max = 254)
        String primaryAuthorEmail,

        @Size(max = 255)
        @Pattern(regexp = "^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$", message = "url_path must be alphanumeric with . _ -")
        String urlPath,

        @URL @Size(max = 2048)
        String licenseUrl,

        @Size(max = 512)
        String copyrightHolder,

        Integer copyrightYear,

        @Size(max = 64)
        String pages,

        @NotNull @Size(min = 1)
        Map<String, String> title,

        @NotNull
        Map<String, String> abstractText,

        @NotNull
        List<@Size(max = 128) String> keywords,

        @NotNull
        List<@Size(max = 128) String> disciplines,

        @NotNull @Size(min = 2, max = 8)
        String locale
) {
}
