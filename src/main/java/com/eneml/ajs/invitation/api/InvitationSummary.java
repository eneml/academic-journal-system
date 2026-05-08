package com.eneml.ajs.invitation.api;

import java.time.Instant;
import java.util.Map;

public record InvitationSummary(
        Long id,
        InvitationType type,
        String email,
        Map<String, Object> payload,
        InvitationStatus status,
        Long invitedByUserId,
        Long acceptedUserId,
        Instant expiresAt,
        Instant acceptedAt,
        Instant createdAt
) {
}
