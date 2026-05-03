package com.eneml.ajs.identity.internal.web.dto;

import com.eneml.ajs.identity.api.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UserStatusUpdateRequest(@NotNull UserStatus status) {
}
