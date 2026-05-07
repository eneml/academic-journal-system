package com.eneml.ajs.messaging.internal.web.dto;

public record EmailTemplateLocaleResponse(
        String locale,
        String subject,
        String body) {
}
