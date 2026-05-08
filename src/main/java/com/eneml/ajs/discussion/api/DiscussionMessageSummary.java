package com.eneml.ajs.discussion.api;

import java.time.Instant;

public record DiscussionMessageSummary(
        Long id,
        Long discussionId,
        Long authorUserId,
        String body,
        Instant postedAt,
        Instant editedAt) {
}
