package com.eneml.ajs.integration.internal.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Posts a JSON article payload to DOAJ. The API returns 201 Created on
 * success with a location header containing the DOAJ-assigned id; we
 * surface that as the {@code externalRef} on the deposit record.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class DoajClient {

    private final IntegrationProperties properties;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15)).build();

    public Result submit(String jsonBody) {
        IntegrationProperties.Doaj cfg = properties.doaj();
        if (!cfg.enabled()) {
            return new Result(false, null, "DOAJ deposit disabled by configuration", null);
        }
        String url = cfg.apiUrl();
        if (cfg.apiKey() != null && !cfg.apiKey().isBlank()) {
            url = url + (url.contains("?") ? "&" : "?") + "api_key=" + cfg.apiKey();
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(45))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status == 201 || status == 200) {
                String externalRef = extractId(response.body());
                return new Result(true, externalRef, null, response.body());
            }
            log.warn("DOAJ deposit failed: HTTP {} body={}", status, response.body());
            return new Result(false, null, "HTTP " + status + ": " + response.body(), response.body());
        } catch (Exception e) {
            log.warn("DOAJ deposit threw: {}", e.getMessage(), e);
            return new Result(false, null, e.getClass().getSimpleName() + ": " + e.getMessage(), null);
        }
    }

    /**
     * DOAJ returns {@code {"status":"ok","id":"..."}} on success. We grab
     * the id naively without pulling Jackson into this hot path.
     */
    private static String extractId(String body) {
        if (body == null) return null;
        int idx = body.indexOf("\"id\"");
        if (idx < 0) return null;
        int colon = body.indexOf(':', idx);
        if (colon < 0) return null;
        int quoteOpen = body.indexOf('"', colon);
        if (quoteOpen < 0) return null;
        int quoteClose = body.indexOf('"', quoteOpen + 1);
        if (quoteClose < 0) return null;
        return body.substring(quoteOpen + 1, quoteClose);
    }

    public record Result(boolean accepted, String externalRef, String errorMessage, String responseBody) {}
}
