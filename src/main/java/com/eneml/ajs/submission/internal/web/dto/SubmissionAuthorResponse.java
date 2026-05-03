package com.eneml.ajs.submission.internal.web.dto;

import java.time.Instant;
import java.util.Map;

public record SubmissionAuthorResponse(
        Long id,
        Long submissionId,
        int seq,
        String givenName,
        String familyName,
        String email,
        String orcidId,
        String affiliation,
        Map<String, String> biography,
        String country,
        boolean corresponding,
        boolean includeInBrowse,
        Long userId,
        long version,
        Instant updatedAt
) {
}
