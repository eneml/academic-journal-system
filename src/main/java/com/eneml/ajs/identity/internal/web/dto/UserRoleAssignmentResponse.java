package com.eneml.ajs.identity.internal.web.dto;

import com.eneml.ajs.identity.api.Role;

import java.time.Instant;

public record UserRoleAssignmentResponse(
        Long id,
        Long userId,
        Role role,
        Long scopeSectionId,
        Long assignedByUserId,
        Instant dateAssigned,
        Instant dateRevoked
) {
}
