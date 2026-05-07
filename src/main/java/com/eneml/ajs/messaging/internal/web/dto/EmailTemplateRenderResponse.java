package com.eneml.ajs.messaging.internal.web.dto;

public record EmailTemplateRenderResponse(
        String key,
        String locale,
        boolean configured,
        String subject,
        String body) {
}
