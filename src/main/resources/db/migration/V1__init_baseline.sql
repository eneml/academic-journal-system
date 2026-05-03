-- =================================================================
-- Baseline migration — Phase 0 foundation
-- =================================================================
-- This migration installs only:
--   1. PostgreSQL extensions used across modules
--   2. Spring Modulith event-publication outbox tables
--
-- Each module owns its own migrations starting at V2 (e.g.
-- V2__identity_init.sql, V3__journal_init.sql, etc.). Keep one
-- migration per module per change — never edit applied migrations.
-- =================================================================

-- Extensions ------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- typo-tolerant search
CREATE EXTENSION IF NOT EXISTS unaccent;    -- diacritic-folding for search
CREATE EXTENSION IF NOT EXISTS citext;      -- case-insensitive emails
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid()

-- Spring Modulith event publication outbox -----------------------
-- Schema sourced from spring-modulith-events-jdbc/.../schema-postgresql.sql
-- We own it via Flyway so DDL stays under version control.
CREATE TABLE IF NOT EXISTS event_publication (
    id               UUID         NOT NULL,
    listener_id      TEXT         NOT NULL,
    event_type       TEXT         NOT NULL,
    serialized_event TEXT         NOT NULL,
    publication_date TIMESTAMP    NOT NULL,
    completion_date  TIMESTAMP    NULL,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS event_publication_serialized_event_hash_idx
    ON event_publication USING hash (serialized_event);

CREATE INDEX IF NOT EXISTS event_publication_by_completion_date_idx
    ON event_publication (completion_date);

CREATE TABLE IF NOT EXISTS event_publication_archive (
    id               UUID         NOT NULL,
    listener_id      TEXT         NOT NULL,
    event_type       TEXT         NOT NULL,
    serialized_event TEXT         NOT NULL,
    publication_date TIMESTAMP    NOT NULL,
    completion_date  TIMESTAMP    NULL,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS event_publication_archive_by_completion_date_idx
    ON event_publication_archive (completion_date);
