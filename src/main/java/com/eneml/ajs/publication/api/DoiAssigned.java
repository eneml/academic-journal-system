package com.eneml.ajs.publication.api;

import java.time.Instant;

/**
 * Emitted when a DOI string is recorded against a publication or
 * galley — registration with the registrar (CrossRef) happens later
 * via the integration module.
 */
public record DoiAssigned(
        Long doiId,
        String doi,
        String assocType,   // "publication" or "galley"
        Long assocId,
        Instant occurredAt
) {

    public static DoiAssigned of(Long doiId, String doi, String assocType, Long assocId) {
        return new DoiAssigned(doiId, doi, assocType, assocId, Instant.now());
    }
}
