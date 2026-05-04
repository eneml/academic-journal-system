package com.eneml.ajs.publication.api;

import java.time.Instant;

public record GalleyApproved(Long galleyId, Long publicationId, Instant occurredAt) {

    public static GalleyApproved of(Long galleyId, Long publicationId) {
        return new GalleyApproved(galleyId, publicationId, Instant.now());
    }
}
