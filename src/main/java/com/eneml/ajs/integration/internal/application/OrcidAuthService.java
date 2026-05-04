package com.eneml.ajs.integration.internal.application;

import com.eneml.ajs.integration.internal.domain.OrcidCredentials;
import com.eneml.ajs.integration.internal.persistence.OrcidCredentialsRepository;
import com.eneml.ajs.shared.exception.ConflictException;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Orchestrates ORCID's OAuth 2 authorization-code flow:
 *
 * <ol>
 *   <li>{@link #buildAuthorizeUrl(Long)} — issue the authorize redirect with a
 *       single-use {@code state} pinned to the local user id. State is held
 *       in an in-memory cache for 10 minutes.</li>
 *   <li>{@link #handleCallback(String, String)} — verify state, exchange the
 *       code for tokens, and persist {@link OrcidCredentials}.</li>
 * </ol>
 *
 * <p>State storage is in-process — single-instance deployments only.
 * Multi-instance deploys should swap the cache for Redis.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrcidAuthService {

    private final OrcidCredentialsRepository repository;
    private final IntegrationProperties properties;
    @Qualifier("integrationRestClient")
    private final RestClient http;

    @Value("${app.base-url:http://localhost:8080}")
    private String backendBaseUrl;

    /** Maps a one-shot {@code state} value to the local user id that requested the flow. */
    private final Cache<String, Long> pendingStates = Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    private static final SecureRandom RANDOM = new SecureRandom();

    public boolean isEnabled() {
        return properties.orcid().enabled()
                && properties.orcid().clientId() != null && !properties.orcid().clientId().isBlank()
                && properties.orcid().clientSecret() != null && !properties.orcid().clientSecret().isBlank();
    }

    public String buildAuthorizeUrl(Long userId) {
        if (!isEnabled()) {
            throw new ConflictException("ORCID integration is not configured");
        }
        IntegrationProperties.Orcid cfg = properties.orcid();
        String state = newState();
        pendingStates.put(state, userId);
        // ORCID's authorize endpoint lives on the public domain (orcid.org or
        // sandbox.orcid.org), not on api.orcid.org — derive it from apiUrl.
        String authBase = cfg.apiUrl().contains("sandbox")
                ? "https://sandbox.orcid.org"
                : "https://orcid.org";
        return UriComponentsBuilder.fromUriString(authBase + "/oauth/authorize")
                .queryParam("client_id", cfg.clientId())
                .queryParam("response_type", "code")
                .queryParam("scope", "/activities/update")
                .queryParam("redirect_uri", redirectUri())
                .queryParam("state", state)
                .build(true)
                .toUriString();
    }

    @Transactional
    public OrcidCredentials handleCallback(String code, String state) {
        Long userId = pendingStates.asMap().remove(state);
        if (userId == null) {
            throw new ConflictException("Invalid or expired state token");
        }
        IntegrationProperties.Orcid cfg = properties.orcid();
        TokenResponse token = exchangeCodeForToken(code, cfg);
        OrcidCredentials creds = repository.findById(userId).orElseGet(OrcidCredentials::new);
        creds.setUserId(userId);
        creds.setOrcidId(token.orcid());
        creds.setAccessToken(token.accessToken());
        creds.setRefreshToken(token.refreshToken());
        creds.setScope(token.scope() == null ? "/activities/update" : token.scope());
        creds.setExpiresAt(token.expiresIn() == null ? null
                : Instant.now().plusSeconds(token.expiresIn()));
        return repository.save(creds);
    }

    public Optional<OrcidCredentials> findFor(Long userId) {
        return repository.findById(userId);
    }

    /**
     * Refresh a near-expired access token using its stored refresh token.
     * Call right before pushing a work record so the OAuth bearer never
     * 401s on us. Returns {@code Optional.empty()} if no refresh token is
     * on file or the rotation fails — caller should mark the deposit SKIPPED.
     */
    @Transactional
    public Optional<OrcidCredentials> refreshIfNeeded(OrcidCredentials creds) {
        if (creds == null) return Optional.empty();
        if (!shouldRefresh(creds)) return Optional.of(creds);
        if (creds.getRefreshToken() == null || creds.getRefreshToken().isBlank()) {
            log.warn("ORCID credentials for user {} expired but no refresh token on file",
                    creds.getUserId());
            return Optional.empty();
        }
        IntegrationProperties.Orcid cfg = properties.orcid();
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("client_id", cfg.clientId());
            form.add("client_secret", cfg.clientSecret());
            form.add("grant_type", "refresh_token");
            form.add("refresh_token", creds.getRefreshToken());
            TokenResponse token = http.post()
                    .uri(cfg.apiUrl() + "/oauth/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(form)
                    .retrieve()
                    .body(TokenResponse.class);
            if (token == null || token.accessToken() == null) {
                return Optional.empty();
            }
            creds.setAccessToken(token.accessToken());
            // ORCID may rotate the refresh token; keep the existing one if it doesn't.
            if (token.refreshToken() != null && !token.refreshToken().isBlank()) {
                creds.setRefreshToken(token.refreshToken());
            }
            if (token.scope() != null && !token.scope().isBlank()) {
                creds.setScope(token.scope());
            }
            creds.setExpiresAt(token.expiresIn() == null ? null
                    : Instant.now().plusSeconds(token.expiresIn()));
            return Optional.of(repository.save(creds));
        } catch (RuntimeException e) {
            log.warn("ORCID refresh failed for user {}: {}",
                    creds.getUserId(), e.getMessage());
            return Optional.empty();
        }
    }

    private static boolean shouldRefresh(OrcidCredentials creds) {
        if (creds.getExpiresAt() == null) return false;
        // Refresh anything that expires within the next 60s — gives a buffer
        // so a token doesn't go stale mid-flight between the check and the PUT.
        return creds.getExpiresAt().isBefore(Instant.now().plusSeconds(60));
    }

    private TokenResponse exchangeCodeForToken(String code, IntegrationProperties.Orcid cfg) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", cfg.clientId());
        form.add("client_secret", cfg.clientSecret());
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", redirectUri());
        return http.post()
                .uri(cfg.apiUrl() + "/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .body(form)
                .retrieve()
                .body(TokenResponse.class);
    }

    private String redirectUri() {
        // Backend exposes the callback at /api/v1/integration/orcid/callback;
        // the public-facing URL comes from {@code app.base-url} so dev and
        // prod deployments can register the right redirect with ORCID.
        String base = backendBaseUrl;
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        return base + "/api/v1/integration/orcid/callback";
    }

    private static String newState() {
        byte[] buf = new byte[24];
        RANDOM.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    public record TokenResponse(
            @JsonProperty("access_token") String accessToken,
            @JsonProperty("refresh_token") String refreshToken,
            @JsonProperty("token_type") String tokenType,
            @JsonProperty("expires_in") Long expiresIn,
            String scope,
            String orcid,
            String name
    ) {
    }
}
