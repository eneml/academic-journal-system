package com.eneml.ajs.discussion.api;

import com.eneml.ajs.submission.api.SubmissionStage;

import java.time.Instant;
import java.util.List;

public record DiscussionStarted(
        Long discussionId,
        Long submissionId,
        SubmissionStage stage,
        String subject,
        Long startedByUserId,
        List<Long> participantUserIds,
        Instant occurredAt) {

    public static DiscussionStarted of(Long discussionId, Long submissionId,
                                        SubmissionStage stage, String subject,
                                        Long startedByUserId, List<Long> participants) {
        return new DiscussionStarted(discussionId, submissionId, stage, subject,
                startedByUserId, participants, Instant.now());
    }
}
