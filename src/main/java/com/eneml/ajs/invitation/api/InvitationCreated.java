package com.eneml.ajs.invitation.api;

import java.time.Instant;

/**
 * Fired the moment an editor enqueues an invitation. Carries the bare
 * minimum the messaging listener needs to render the email (the random
 * secret, expiry deadline). Full payload + key hash live in the entity.
 */
public record InvitationCreated(
        Long invitationId,
        InvitationType type,
        String email,
        String secret,
        Instant expiresAt,
        Long invitedByUserId,
        Instant occurredAt
) {

    public static InvitationCreated of(Long invitationId, InvitationType type, String email,
                                        String secret, Instant expiresAt, Long invitedByUserId) {
        return new InvitationCreated(invitationId, type, email, secret, expiresAt,
                invitedByUserId, Instant.now());
    }
}
