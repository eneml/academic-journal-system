package com.eneml.ajs.discussion.internal.web.dto;

import com.eneml.ajs.submission.api.SubmissionStage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record DiscussionOpenRequest(
        @NotNull SubmissionStage stage,
        @NotBlank @Size(max = 512) String subject,
        @Size(max = 65536) String firstMessage,
        Set<Long> participantUserIds) {
}
