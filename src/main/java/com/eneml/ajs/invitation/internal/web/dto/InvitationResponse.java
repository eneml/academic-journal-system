package com.eneml.ajs.invitation.internal.web.dto;

import com.eneml.ajs.invitation.api.InvitationStatus;
import com.eneml.ajs.invitation.api.InvitationType;

import java.time.Instant;
import java.util.Map;

public record InvitationResponse(
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
