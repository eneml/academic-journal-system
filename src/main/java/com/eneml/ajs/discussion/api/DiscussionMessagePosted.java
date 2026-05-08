package com.eneml.ajs.discussion.api;

import com.eneml.ajs.submission.api.SubmissionStage;

import java.time.Instant;
import java.util.List;

public record DiscussionMessagePosted(
        Long discussionId,
        Long messageId,
        Long submissionId,
        SubmissionStage stage,
        String subject,
        Long authorUserId,
        List<Long> recipientUserIds,
        Instant occurredAt) {

    public static DiscussionMessagePosted of(Long discussionId, Long messageId,
                                              Long submissionId, SubmissionStage stage,
                                              String subject, Long authorUserId,
                                              List<Long> recipients) {
        return new DiscussionMessagePosted(discussionId, messageId, submissionId, stage,
                subject, authorUserId, recipients, Instant.now());
    }
}
