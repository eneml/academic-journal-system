package com.eneml.ajs.issue.internal.web.dto;

import java.time.Instant;
import java.util.Map;

public record IssueGalleyResponse(
        Long id,
        Long issueId,
        Long storedFileId,
        String remoteUrl,
        String locale,
        Map<String, String> label,
        int seq,
        boolean approved,
        Long doiId,
        long version,
        Instant updatedAt
) {
}
