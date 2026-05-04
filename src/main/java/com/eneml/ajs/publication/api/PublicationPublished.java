package com.eneml.ajs.publication.api;

import java.time.Instant;

public record PublicationPublished(
        Long publicationId,
        Long submissionId,
        Long sectionId,
        Long issueId,
        int version,
        Instant occurredAt
) {

    public static PublicationPublished of(Long publicationId, Long submissionId,
                                           Long sectionId, Long issueId, int version) {
        return new PublicationPublished(publicationId, submissionId, sectionId, issueId, version, Instant.now());
    }
}
