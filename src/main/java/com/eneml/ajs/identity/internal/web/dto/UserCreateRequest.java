package com.eneml.ajs.identity.internal.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(

        @NotBlank @Size(max = 64)
        String keycloakSub,

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
        String orcidId
) {
}
