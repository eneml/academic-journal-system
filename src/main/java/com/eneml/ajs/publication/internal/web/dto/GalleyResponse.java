package com.eneml.ajs.publication.internal.web.dto;

import java.time.Instant;
import java.util.Map;

public record GalleyResponse(
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
        Long publisherId,
        long version,
        Instant updatedAt
) {
}
