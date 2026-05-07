package com.eneml.ajs.messaging.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailTemplateLocaleUpsertRequest(
        @NotBlank @Size(max = 512) String subject,
        @NotBlank String body) {
}
