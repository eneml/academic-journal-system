package com.eneml.ajs.integration.internal.application;

import com.eneml.ajs.integration.internal.domain.OrcidCredentials;
import com.eneml.ajs.integration.internal.persistence.OrcidCredentialsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Instant;

/**
 * Pushes a single ORCID work record on behalf of an authorized member.
 * Returns a {@link Result} carrying the put-code (ORCID's stable id for
 * the work record) on success, or an error message otherwise.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class OrcidClient {

    private final IntegrationProperties properties;
    private final OrcidCredentialsRepository credentialsRepository;
    @Qualifier("integrationRestClient")
    private final RestClient http;

    Result pushWork(OrcidCredentials creds, String workXml) {
        if (creds == null || creds.getAccessToken() == null || creds.getAccessToken().isBlank()) {
            return new Result(false, null, null, "No ORCID credentials on file");
        }
        if (creds.isExpired()) {
            // Dispatcher refreshes via OrcidAuthService.refreshIfNeeded before
            // reaching us. Hitting this branch means the refresh itself failed.
            return new Result(false, null, null, "ORCID access token expired (refresh failed)");
        }
        IntegrationProperties.Orcid cfg = properties.orcid();
        String url = cfg.apiUrl() + "/v3.0/" + creds.getOrcidId() + "/work";
        try {
            String responseBody = http.post()
                    .uri(url)
                    .contentType(MediaType.parseMediaType("application/vnd.orcid+xml"))
                    .accept(MediaType.parseMediaType("application/vnd.orcid+xml"))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + creds.getAccessToken())
                    .body(workXml)
                    .retrieve()
                    .body(String.class);
            String putCode = extractLocationPutCode(responseBody);
            creds.setLastPushedAt(Instant.now());
            credentialsRepository.save(creds);
            return new Result(true, putCode, responseBody, null);
        } catch (RestClientResponseException e) {
            log.warn("ORCID rejected work push ({}): {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            return new Result(false, null, e.getResponseBodyAsString(),
                    "HTTP " + e.getStatusCode());
        } catch (RuntimeException e) {
            log.warn("ORCID call failed", e);
            return new Result(false, null, null, e.getMessage());
        }
    }

    private static String extractLocationPutCode(String body) {
        // ORCID returns the put-code as the trailing path segment of the
        // 201 Location header. RestClient already followed the Location
        // header into the body for us, so we fall back to scanning for it.
        if (body == null) return null;
        int idx = body.lastIndexOf("put-code=\"");
        if (idx < 0) return null;
        int end = body.indexOf('"', idx + "put-code=\"".length());
        return end < 0 ? null : body.substring(idx + "put-code=\"".length(), end);
    }

    record Result(boolean accepted, String putCode, String responseBody, String errorMessage) {}
}
