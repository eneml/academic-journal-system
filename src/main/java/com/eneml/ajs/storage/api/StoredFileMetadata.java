package com.eneml.ajs.storage.api;

import java.time.Instant;

public record StoredFileMetadata(
        Long id,
        String contentType,
        long sizeBytes,
        String sha256Hex,
        String originalFilename,
        Long uploadedByUserId,
        Instant uploadedAt
) {
}
