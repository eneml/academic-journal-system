package com.eneml.ajs.storage.api;

import java.time.Instant;

public record FileStored(
        Long fileId,
        String contentType,
        long sizeBytes,
        Long uploadedByUserId,
        Instant occurredAt
) {

    public static FileStored of(Long fileId, String contentType, long sizeBytes, Long uploadedByUserId) {
        return new FileStored(fileId, contentType, sizeBytes, uploadedByUserId, Instant.now());
    }
}
