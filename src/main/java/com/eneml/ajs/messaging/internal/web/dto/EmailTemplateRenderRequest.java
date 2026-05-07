package com.eneml.ajs.messaging.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record EmailTemplateRenderRequest(
        @NotBlank @Size(max = 8) String locale,
        Map<String, Object> vars) {
}
