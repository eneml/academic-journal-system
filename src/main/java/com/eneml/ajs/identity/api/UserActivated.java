package com.eneml.ajs.identity.api;

import java.time.Instant;

public record UserActivated(Long userId, Instant occurredAt) {

    public static UserActivated of(Long userId) {
        return new UserActivated(userId, Instant.now());
    }
}
