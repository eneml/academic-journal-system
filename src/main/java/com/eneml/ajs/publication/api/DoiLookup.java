package com.eneml.ajs.publication.api;

import java.util.Optional;

/**
 * Read-only access to DOI records for other modules (e.g. integration
 * services that need to resolve a numeric DOI id back into the
 * registered DOI string when emitting CrossRef deposits).
 */
public interface DoiLookup {

    Optional<DoiSummary> findById(Long doiId);

    Optional<DoiSummary> findByDoi(String doi);
}
