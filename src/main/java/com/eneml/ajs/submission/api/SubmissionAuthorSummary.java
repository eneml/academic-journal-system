package com.eneml.ajs.submission.api;

public record SubmissionAuthorSummary(
        Long id,
        Long submissionId,
        int seq,
        String givenName,
        String familyName,
        String email,
        String orcidId,
        String affiliation,
        boolean corresponding,
        boolean includeInBrowse,
        Long userId
) {
}
