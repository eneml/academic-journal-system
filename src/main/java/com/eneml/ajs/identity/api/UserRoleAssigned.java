package com.eneml.ajs.identity.api;

import java.time.Instant;

public record UserRoleAssigned(
        Long userId,
        Role role,
        Long scopeSectionId,
        Instant occurredAt
) {

    public static UserRoleAssigned of(Long userId, Role role, Long scopeSectionId) {
        return new UserRoleAssigned(userId, role, scopeSectionId, Instant.now());
    }
}
