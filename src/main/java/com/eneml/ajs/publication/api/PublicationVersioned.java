package com.eneml.ajs.publication.api;

import java.time.Instant;

public record PublicationVersioned(
        Long newPublicationId,
        Long previousPublicationId,
        Long submissionId,
        int newVersion,
        Instant occurredAt
) {

    public static PublicationVersioned of(Long newId, Long previousId, Long submissionId, int newVersion) {
        return new PublicationVersioned(newId, previousId, submissionId, newVersion, Instant.now());
    }
}
