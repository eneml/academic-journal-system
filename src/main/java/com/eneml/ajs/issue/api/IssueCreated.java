package com.eneml.ajs.issue.api;

import java.time.Instant;

public record IssueCreated(Long issueId, Instant occurredAt) {

    public static IssueCreated of(Long issueId) {
        return new IssueCreated(issueId, Instant.now());
    }
}
