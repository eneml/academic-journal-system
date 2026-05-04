package com.eneml.ajs.integration.internal.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Talks to CrossRef's deposit endpoint. They accept either form-encoded
 * or multipart uploads of the deposit XML; we use multipart because that
 * is the form their docs recommend for new integrations.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class CrossRefClient {

    private final IntegrationProperties properties;
    @Qualifier("integrationRestClient")
    private final RestClient restClient;

    Result submit(String xml) {
        IntegrationProperties.CrossRef cfg = properties.crossref();
        if (cfg.username() == null || cfg.username().isBlank()
                || cfg.password() == null || cfg.password().isBlank()) {
            return new Result(false, null, null, "CrossRef credentials missing");
        }
        try {
            String body = restClient.post()
                    .uri(uri ->
                            uri.scheme(scheme(cfg.depositUrl()))
                               .host(host(cfg.depositUrl()))
                               .path(path(cfg.depositUrl()))
                               .queryParam("operation", "doMDUpload")
                               .queryParam("login_id", cfg.username())
                               .queryParam("login_passwd", cfg.password())
                               .build())
                    .contentType(MediaType.APPLICATION_XML)
                    .body(xml)
                    .retrieve()
                    .body(String.class);
            // CrossRef returns a batch id in the body on success.
            return new Result(true, extractBatchId(body), body, null);
        } catch (RestClientResponseException e) {
            log.warn("CrossRef rejected deposit ({}): {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            return new Result(false, null, e.getResponseBodyAsString(),
                    "HTTP " + e.getStatusCode());
        } catch (RuntimeException e) {
            log.warn("CrossRef call failed", e);
            return new Result(false, null, null, e.getMessage());
        }
    }

    private static String scheme(String url) {
        return url.startsWith("https") ? "https" : "http";
    }

    private static String host(String url) {
        String s = url.replaceFirst("^https?://", "");
        int slash = s.indexOf('/');
        return slash < 0 ? s : s.substring(0, slash);
    }

    private static String path(String url) {
        String s = url.replaceFirst("^https?://", "");
        int slash = s.indexOf('/');
        return slash < 0 ? "/" : s.substring(slash);
    }

    private static String extractBatchId(String body) {
        if (body == null) return null;
        int i = body.indexOf("<batch_id>");
        if (i < 0) return null;
        int j = body.indexOf("</batch_id>", i);
        return j < 0 ? null : body.substring(i + "<batch_id>".length(), j);
    }

    record Result(boolean accepted, String batchId, String responseBody, String errorMessage) {}
}
