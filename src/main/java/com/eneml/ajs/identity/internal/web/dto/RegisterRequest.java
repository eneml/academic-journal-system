package com.eneml.ajs.identity.internal.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Public self-registration payload. The backend creates a Keycloak user
 * with these credentials, assigns the default realm role, and returns
 * 201; the SPA then logs the new user in via Direct Access Grant.
 */
public record RegisterRequest(
        @NotBlank @Email @Size(max = 254)
        String email,

        @NotBlank @Size(min = 8, max = 200,
                message = "Password must be at least 8 characters")
        String password,

        @NotBlank @Size(max = 80)
        String givenName,

        @NotBlank @Size(max = 80)
        String familyName
) {
}
