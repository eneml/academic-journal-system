package com.eneml.ajs.publication.api;

import java.time.Instant;

public record PublicationUnpublished(Long publicationId, Long submissionId, Instant occurredAt) {

    public static PublicationUnpublished of(Long publicationId, Long submissionId) {
        return new PublicationUnpublished(publicationId, submissionId, Instant.now());
    }
}
