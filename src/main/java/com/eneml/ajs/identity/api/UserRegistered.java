package com.eneml.ajs.identity.api;

import java.time.Instant;

public record UserRegistered(Long userId, String email, Instant occurredAt) {

    public static UserRegistered of(Long userId, String email) {
        return new UserRegistered(userId, email, Instant.now());
    }
}
