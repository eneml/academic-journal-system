package com.eneml.ajs.submission.api;

import java.time.Instant;

public record ReviewerSuggestionSummary(
        Long id,
        Long submissionId,
        String givenName,
        String familyName,
        String email,
        String orcidId,
        String affiliation,
        String suggestionReason,
        Long existingUserId,
        Instant approvedAt,
        Long approvedByUserId,
        Instant createdAt) {

    public String fullName() {
        if (givenName == null && familyName == null) return email;
        if (givenName == null) return familyName;
        if (familyName == null) return givenName;
        return givenName + " " + familyName;
    }
}
