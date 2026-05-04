package com.eneml.ajs.identity.internal.application;

import com.eneml.ajs.shared.exception.ConflictException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Thin wrapper around Keycloak's Admin REST API. Caches the admin token
 * server-side and refreshes it 30 seconds before expiry, so registration
 * calls don't pay the token round-trip on every request.
 *
 * <p>Currently exposes only the operations the public registration flow
 * needs: create-user + assign-default-role. Other admin operations (list /
 * disable / role mapping) live elsewhere — this class is intentionally
 * narrow.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminClient {

    private final KeycloakAdminProperties properties;
    @Qualifier("keycloakAdminRestClient")
    private final RestClient restClient;

    private volatile CachedToken cachedToken;

    /**
     * Create a Keycloak user in the target realm with the given credentials
     * and the configured default role (AUTHOR by default). Returns the new
     * user's Keycloak subject id.
     *
     * @throws ConflictException if a user with that email already exists.
     */
    public String createUser(String email, String password,
                             String givenName, String familyName) {
        String token = adminToken();
        Map<String, Object> userRep = Map.of(
                "email", email,
                "username", email,
                "firstName", emptyToNull(givenName),
                "lastName", emptyToNull(familyName),
                "enabled", true,
                "emailVerified", true,
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", password,
                        "temporary", false
                ))
        );

        URI usersUri = realmUri("users").build().toUri();
        try {
            // The create-user endpoint returns 201 with a Location header
            // pointing at the new user resource — we read the id off the URL.
            URI location = restClient.post()
                    .uri(usersUri)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(userRep)
                    .retrieve()
                    .toBodilessEntity()
                    .getHeaders()
                    .getLocation();
            if (location == null) {
                throw new IllegalStateException(
                        "Keycloak create-user returned 201 without Location");
            }
            String userId = lastSegment(location.toString());
            assignDefaultRole(token, userId);
            log.info("Provisioned Keycloak user {} ({})", userId, email);
            return userId;
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 409) {
                throw new ConflictException(
                        "An account with this email already exists.");
            }
            // Surface Keycloak's error body so callers see the real reason
            // (password policy violation, etc.) instead of "internal error".
            String body = e.getResponseBodyAsString();
            throw new IllegalStateException(
                    "Keycloak rejected user creation: " + e.getStatusCode()
                            + " " + body, e);
        }
    }

    /**
     * Assign the configured default realm role to a freshly-created user.
     * Keycloak's user-creation endpoint accepts a {@code realmRoles} array
     * on the user representation but in practice ignores it (it only works
     * during realm import); the proper API is the role-mappings endpoint.
     */
    private void assignDefaultRole(String adminToken, String userId) {
        String roleName = properties.defaultRole();
        if (roleName == null || roleName.isBlank()) return;

        // Look up the role's id + name (Keycloak wants the full RoleRepresentation
        // in the role-mapping POST, not just the name).
        URI roleUri = realmUri("roles", roleName).build().toUri();
        Map<String, Object> roleRep;
        try {
            roleRep = restClient.get()
                    .uri(roleUri)
                    .header("Authorization", "Bearer " + adminToken)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            log.warn("Default role '{}' not found in realm '{}': {}",
                    roleName, properties.targetRealm(), e.getStatusCode());
            return;
        }
        if (roleRep == null) return;

        URI mappingsUri = realmUri("users", userId, "role-mappings", "realm")
                .build().toUri();
        try {
            restClient.post()
                    .uri(mappingsUri)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of(Map.of(
                            "id", roleRep.get("id"),
                            "name", roleRep.get("name"))))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.warn("Failed to assign default role '{}' to user {}: {}",
                    roleName, userId, e.getStatusCode());
        }
    }

    // ------------------------------------------------------------------
    // Token caching
    // ------------------------------------------------------------------

    private synchronized String adminToken() {
        CachedToken c = cachedToken;
        if (c != null && c.expiresAt.isAfter(Instant.now().plusSeconds(30))) {
            return c.value;
        }
        URI tokenUri = UriComponentsBuilder.fromUriString(properties.url())
                .pathSegment("realms", "master",
                        "protocol", "openid-connect", "token")
                .build().toUri();
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restClient.post()
                    .uri(tokenUri)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body("grant_type=password"
                            + "&client_id=" + urlencode(properties.master().clientId())
                            + "&username=" + urlencode(properties.master().username())
                            + "&password=" + urlencode(properties.master().password()))
                    .retrieve()
                    .body(Map.class);
            if (body == null || body.get("access_token") == null) {
                throw new IllegalStateException(
                        "Keycloak admin token response missing access_token");
            }
            String access = body.get("access_token").toString();
            int expiresIn = body.get("expires_in") instanceof Number n
                    ? n.intValue() : 60;
            CachedToken fresh = new CachedToken(access,
                    Instant.now().plus(Duration.ofSeconds(expiresIn)));
            this.cachedToken = fresh;
            return access;
        } catch (RestClientResponseException e) {
            String body = e.getResponseBodyAsString();
            throw new IllegalStateException(
                    "Keycloak admin login failed: " + e.getStatusCode() + " " + body, e);
        }
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    private UriComponentsBuilder realmUri(String... pathSegments) {
        UriComponentsBuilder b = UriComponentsBuilder.fromUriString(properties.url())
                .pathSegment("admin", "realms", properties.targetRealm());
        for (String seg : pathSegments) {
            b.pathSegment(seg);
        }
        return b;
    }

    private static String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    private static String lastSegment(String url) {
        int i = url.lastIndexOf('/');
        return i < 0 ? url : url.substring(i + 1);
    }

    private static String urlencode(String s) {
        return java.net.URLEncoder.encode(
                Objects.requireNonNullElse(s, "").trim(),
                java.nio.charset.StandardCharsets.UTF_8);
    }

    private record CachedToken(String value, Instant expiresAt) {
    }

    // ------------------------------------------------------------------
    // Wiring
    // ------------------------------------------------------------------

    @Configuration
    @EnableConfigurationProperties(KeycloakAdminProperties.class)
    static class Config {
        @Bean(name = "keycloakAdminRestClient")
        RestClient keycloakAdminRestClient(KeycloakAdminProperties props) {
            return RestClient.builder()
                    .baseUrl(Objects.requireNonNullElse(props.url(),
                            "http://localhost:8081"))
                    .defaultStatusHandler(
                            HttpStatusCode::isError,
                            (req, res) -> {
                                // bubble up — RestClient throws by default but
                                // attaches the status + body so callers can
                                // diagnose 4xx like 409 conflict cleanly.
                            })
                    .build();
        }
    }

    @SuppressWarnings("unused")
    private static String unused() { return Locale.ROOT.toString(); }
}
