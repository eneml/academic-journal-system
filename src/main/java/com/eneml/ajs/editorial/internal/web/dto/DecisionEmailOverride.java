package com.eneml.ajs.editorial.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * The editor's edits to one email step before committing. Either keep the
 * pre-rendered subject/body or send something different. Empty
 * recipientUserIds (or skipped=true) means "skip this step" — the listener
 * won't fire its default email for the matching audience.
 */
public record DecisionEmailOverride(
        @NotBlank @Size(max = 64) String stepId,
        @NotBlank @Size(max = 64) String templateKey,
        boolean skipped,
        @Size(max = 512) String subject,
        @Size(max = 65536) String body,
        List<Long> recipientUserIds) {
}
