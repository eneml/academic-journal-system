package com.eneml.ajs.discussion.api;

import com.eneml.ajs.submission.api.SubmissionStage;

import java.time.Instant;
import java.util.List;

public record DiscussionSummary(
        Long id,
        Long submissionId,
        SubmissionStage stage,
        String subject,
        Long startedByUserId,
        boolean closed,
        Instant closedAt,
        Instant dateStarted,
        Instant dateModified,
        int messageCount,
        List<Long> participantUserIds) {
}
