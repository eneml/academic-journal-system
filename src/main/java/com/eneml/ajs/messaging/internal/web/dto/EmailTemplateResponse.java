package com.eneml.ajs.messaging.internal.web.dto;

import java.util.List;

public record EmailTemplateResponse(
        String key,
        String description,
        boolean enabled,
        boolean custom,
        List<EmailTemplateLocaleResponse> locales) {
}
