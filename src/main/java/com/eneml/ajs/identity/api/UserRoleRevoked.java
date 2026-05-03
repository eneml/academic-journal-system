package com.eneml.ajs.identity.api;

import java.time.Instant;

public record UserRoleRevoked(
        Long userId,
        Role role,
        Long scopeSectionId,
        Instant occurredAt
) {

    public static UserRoleRevoked of(Long userId, Role role, Long scopeSectionId) {
        return new UserRoleRevoked(userId, role, scopeSectionId, Instant.now());
    }
}
