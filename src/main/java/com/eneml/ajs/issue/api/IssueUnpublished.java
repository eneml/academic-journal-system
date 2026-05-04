package com.eneml.ajs.issue.api;

import java.time.Instant;

public record IssueUnpublished(Long issueId, Instant occurredAt) {

    public static IssueUnpublished of(Long issueId) {
        return new IssueUnpublished(issueId, Instant.now());
    }
}
