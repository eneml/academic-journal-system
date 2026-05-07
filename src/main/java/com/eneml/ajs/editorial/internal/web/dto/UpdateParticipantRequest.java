package com.eneml.ajs.editorial.internal.web.dto;

public record UpdateParticipantRequest(
        boolean canChangeMetadata,
        boolean recommendOnly) {
}
