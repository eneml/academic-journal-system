package com.eneml.ajs.publication.api;

import java.time.Instant;

public record PublicationDrafted(Long publicationId, Long submissionId, int version, Instant occurredAt) {

    public static PublicationDrafted of(Long publicationId, Long submissionId, int version) {
        return new PublicationDrafted(publicationId, submissionId, version, Instant.now());
    }
}
