package com.eneml.ajs.identity.api;

import java.time.Instant;

public record UserDisabled(Long userId, Instant occurredAt) {

    public static UserDisabled of(Long userId) {
        return new UserDisabled(userId, Instant.now());
    }
}
