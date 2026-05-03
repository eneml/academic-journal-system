package com.eneml.ajs.storage.internal.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "app.storage.s3")
public record StorageProperties(

        @NotBlank
        String endpoint,

        @NotBlank
        String region,

        @NotBlank
        String accessKey,

        @NotBlank
        String secretKey,

        @NotBlank
        String bucket,

        boolean pathStyleAccess,

        @NotNull @Positive
        Long presignedUrlTtlSeconds
) {

    public Duration presignedUrlTtl() {
        return Duration.ofSeconds(presignedUrlTtlSeconds);
    }
}
