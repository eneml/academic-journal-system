package com.eneml.ajs.integration.internal.application;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
@EnableConfigurationProperties(IntegrationProperties.class)
class IntegrationConfig {

    /**
     * Shared HTTP client for outbound deposit calls. Short timeouts so a
     * stuck CrossRef sandbox doesn't hold a deposit worker hostage —
     * failures get retried on the next scheduled tick.
     */
    @Bean(name = "integrationRestClient")
    RestClient integrationRestClient() {
        return RestClient.builder()
                .requestFactory(timeoutFactory())
                .build();
    }

    private static org.springframework.http.client.ClientHttpRequestFactory timeoutFactory() {
        var f = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        f.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        f.setReadTimeout((int) Duration.ofSeconds(30).toMillis());
        return f;
    }
}
