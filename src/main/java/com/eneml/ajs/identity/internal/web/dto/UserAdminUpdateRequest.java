package com.eneml.ajs.identity.internal.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

import java.util.Map;

public record UserAdminUpdateRequest(

        @NotBlank @Email @Size(max = 254)
        String email,

        @Size(max = 128)
        String username,

        @Size(max = 128)
        String givenName,

        @Size(max = 128)
        String familyName,

        @NotBlank @Size(min = 2, max = 8)
        String locale,

        @Size(min = 2, max = 2)
        String country,

        @Pattern(regexp = "^\\d{4}-\\d{4}-\\d{4}-\\d{3}[\\dX]$",
                message = "ORCID iD must match XXXX-XXXX-XXXX-XXXX")
        String orcidId,

        @NotNull
        Map<String, String> biography,

        @Size(max = 512)
        String affiliation,

        @URL @Size(max = 2048)
        String publicUrl,

        @Size(max = 8192)
        String signature,

        @Size(max = 8192)
        String gossipNote
) {
}
