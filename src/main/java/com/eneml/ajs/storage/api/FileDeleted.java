package com.eneml.ajs.storage.api;

import java.time.Instant;

public record FileDeleted(Long fileId, Instant occurredAt) {

    public static FileDeleted of(Long fileId) {
        return new FileDeleted(fileId, Instant.now());
    }
}
