package com.eneml.ajs.publication.api;

import java.time.Instant;

public record GalleyAdded(Long galleyId, Long publicationId, Instant occurredAt) {

    public static GalleyAdded of(Long galleyId, Long publicationId) {
        return new GalleyAdded(galleyId, publicationId, Instant.now());
    }
}
