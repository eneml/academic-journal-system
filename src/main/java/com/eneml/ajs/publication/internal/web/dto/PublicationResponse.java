package com.eneml.ajs.publication.internal.web.dto;

import com.eneml.ajs.publication.api.AccessStatus;
import com.eneml.ajs.publication.api.PublicationStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record PublicationResponse(
        Long id,
        Long submissionId,
        int version,
        PublicationStatus status,
        AccessStatus accessStatus,
        Long sectionId,
        Long issueId,
        String primaryAuthorEmail,
        String urlPath,
        String licenseUrl,
        String copyrightHolder,
        Integer copyrightYear,
        String pages,
        Map<String, String> title,
        Map<String, String> abstractText,
        List<String> keywords,
        List<String> disciplines,
        String locale,
        Instant datePublished,
        long version_no,
        Instant updatedAt
) {
}
