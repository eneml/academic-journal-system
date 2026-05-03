package com.eneml.ajs.identity.internal.web.dto;

import com.eneml.ajs.identity.api.Role;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record UserRoleAssignRequest(

        @NotNull
        Role role,

        @Positive
        Long scopeSectionId
) {
}
