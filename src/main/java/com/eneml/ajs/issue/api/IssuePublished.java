package com.eneml.ajs.issue.api;

import java.time.Instant;

public record IssuePublished(Long issueId, Instant occurredAt) {

    public static IssuePublished of(Long issueId) {
        return new IssuePublished(issueId, Instant.now());
    }
}
