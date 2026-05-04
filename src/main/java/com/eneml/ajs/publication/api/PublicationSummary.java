package com.eneml.ajs.publication.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record PublicationSummary(
        Long id,
        Long submissionId,
        int version,
        PublicationStatus status,
        AccessStatus accessStatus,
        Long sectionId,
        Long issueId,
        String urlPath,
        Map<String, String> title,
        Map<String, String> abstractText,
        List<String> keywords,
        String locale,
        Instant datePublished,
        Long doiId
) {
}
