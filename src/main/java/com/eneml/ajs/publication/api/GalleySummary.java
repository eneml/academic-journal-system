package com.eneml.ajs.publication.api;

import java.time.Instant;
import java.util.Map;

public record GalleySummary(
        Long id,
        Long publicationId,
        Long submissionFileId,
        String remoteUrl,
        String locale,
        Map<String, String> label,
        int seq,
        boolean approved,
        String urlPath,
        Long doiId,
        Instant updatedAt
) {
}
