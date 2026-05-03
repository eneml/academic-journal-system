package com.eneml.ajs.identity.api;

import java.time.Instant;

public record OrcidLinked(Long userId, String orcidId, Instant occurredAt) {

    public static OrcidLinked of(Long userId, String orcidId) {
        return new OrcidLinked(userId, orcidId, Instant.now());
    }
}
