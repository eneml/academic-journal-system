package com.eneml.ajs.storage.api;

/**
 * Lightweight handle returned by the storage module after a successful
 * upload. Other modules persist this id and use it to fetch download URLs
 * or metadata later.
 */
public record StoredFileRef(
        Long id,
        String contentType,
        long sizeBytes,
        String sha256Hex
) {
}
