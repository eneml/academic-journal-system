/**
 * Search module — read-only projections optimized for the public reading
 * site (PostgreSQL FTS via tsvector + pg_trgm + unaccent).
 *
 * <p>Owns: read-only materialized projections (no business entities).
 * <br>Emits: SearchIndexUpdated.
 * <br>Consumes: PublicationPublished, PublicationUnpublished, MetadataChanged.
 *
 * <p>Phase 2 trigger: swap PG FTS for Meilisearch when corpus exceeds
 * ~50K articles or faceted search complexity becomes painful.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Search",
    allowedDependencies = { "shared", "publication::api", "issue::api", "journal::api" }
)
package com.eneml.ajs.search;
