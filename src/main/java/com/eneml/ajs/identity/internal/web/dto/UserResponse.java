package com.eneml.ajs.identity.internal.web.dto;

import com.eneml.ajs.identity.api.UserStatus;

import java.time.Instant;
import java.util.Map;

public record UserResponse(
        Long id,
        String email,
        String username,
        String givenName,
        String familyName,
        String locale,
        String country,
        UserStatus status,
        String orcidId,
        Map<String, String> biography,
        String affiliation,
        String publicUrl,
        String signature,
        Instant lastLoginAt,
        long version,
        Instant updatedAt
) {
}
