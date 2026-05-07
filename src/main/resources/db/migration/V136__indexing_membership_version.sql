-- =================================================================
-- Backfill the version column on indexing_membership. The V128 init
-- shipped without it, but the entity extends AuditableEntity (which
-- declares @Version), so Hibernate's strict schema validation refuses
-- to start. Default 0 matches what AuditableEntity initialises.
-- =================================================================

ALTER TABLE indexing_membership
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
