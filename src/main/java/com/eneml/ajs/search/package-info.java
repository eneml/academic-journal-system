/**
 * Search module — denormalized full-text index over published works,
 * fed by publication lifecycle events and queried via Postgres
 * tsvector. Swapping in Meilisearch later is a matter of replacing the
 * service implementation; the public API stays the same.
 *
 * <p>Owns: PublishedSearchIndex (read-only projection).
 * <br>Emits: nothing.
 * <br>Consumes: PublicationPublished, PublicationUnpublished.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Search",
    allowedDependencies = { "shared", "publication::api", "issue::api", "journal::api",
                            "submission::api", "storage::api" }
)
package com.eneml.ajs.search;
