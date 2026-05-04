package com.eneml.ajs.identity.internal.web;

import com.eneml.ajs.identity.internal.application.KeycloakAdminClient;
import com.eneml.ajs.identity.internal.web.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public self-registration endpoint backing the editorial app's
 * custom /register page. POSTs validated credentials at the Keycloak
 * Admin API via {@link KeycloakAdminClient}, which creates the user
 * and assigns the default role. After 201 the SPA exchanges the
 * email + password for tokens via Direct Access Grant.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth")
class AuthRegistrationController {

    private final KeycloakAdminClient adminClient;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Self-register a new author account (public)")
    void register(@Valid @RequestBody RegisterRequest req) {
        adminClient.createUser(
                req.email().trim().toLowerCase(),
                req.password(),
                req.givenName().trim(),
                req.familyName().trim());
    }
}
