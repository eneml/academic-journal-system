package com.eneml.ajs.integration.internal.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * External-service configuration. All integrations are off by default;
 * production deployments switch them on via env vars and provide
 * credentials. Sandbox endpoints are sensible defaults so a misconfigured
 * deployment never accidentally talks to a live registrar.
 *
 * @param crossref CrossRef DOI deposit endpoint configuration
 * @param orcid    ORCID work-push endpoint configuration
 * @param publicBaseUrl absolute URL of the public reading site, used
 *                      as the {@code <resource>} pointer in CrossRef deposits
 */
@ConfigurationProperties(prefix = "ajs.integration")
public record IntegrationProperties(
        CrossRef crossref,
        Orcid orcid,
        Doaj doaj,
        String publicBaseUrl
) {

    public IntegrationProperties {
        if (crossref == null) crossref = new CrossRef(false, null, null, null, null, null);
        if (orcid == null) orcid = new Orcid(false, null, null, null);
        if (doaj == null) doaj = new Doaj(false, null, null);
        if (publicBaseUrl == null) publicBaseUrl = "http://localhost:3000";
    }

    public record CrossRef(
            boolean enabled,
            String depositUrl,      // https://test.crossref.org/servlet/deposit (sandbox) or live
            String username,
            String password,
            String depositorName,
            String depositorEmail
    ) {
        public CrossRef {
            if (depositUrl == null || depositUrl.isBlank()) {
                depositUrl = "https://test.crossref.org/servlet/deposit";
            }
        }
    }

    public record Orcid(
            boolean enabled,
            String apiUrl,          // https://api.sandbox.orcid.org or https://api.orcid.org
            String clientId,
            String clientSecret
    ) {
        public Orcid {
            if (apiUrl == null || apiUrl.isBlank()) {
                apiUrl = "https://api.sandbox.orcid.org";
            }
        }
    }

    public record Doaj(
            boolean enabled,
            String apiUrl,          // https://doaj.org/api/articles or testdoaj.cottagelabs.com/api/articles
            String apiKey
    ) {
        public Doaj {
            if (apiUrl == null || apiUrl.isBlank()) {
                apiUrl = "https://doaj.org/api/articles";
            }
        }
    }
}
