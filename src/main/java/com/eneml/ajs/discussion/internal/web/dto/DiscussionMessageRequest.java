package com.eneml.ajs.discussion.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DiscussionMessageRequest(
        @NotBlank @Size(max = 65536) String body) {
}
