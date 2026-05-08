package com.eneml.ajs.invitation.internal.web.dto;

import com.eneml.ajs.invitation.api.InvitationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record InvitationCreateRequest(
        @NotNull
        InvitationType type,

        @NotNull @Email @Size(max = 254)
        String email,

        Map<String, Object> payload,

        /** Validity in days. Capped at 90; defaults to 14. */
        @Min(1)
        Integer expiresInDays
) {
}
