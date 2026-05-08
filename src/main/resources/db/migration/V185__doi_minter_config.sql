-- =================================================================
-- Phase 15 — DOI minter + STALE sweep.
--   journal_config: prefix + suffix pattern used by the auto-minter.
--                   The pattern accepts {publicationId} and {year} tokens.
--   doi:           STALE status added to the CHECK so the weekly sweep
--                   can flip rows whose underlying article was edited
--                   after the last successful CrossRef deposit.
-- =================================================================

ALTER TABLE journal_config
    ADD COLUMN doi_prefix         VARCHAR(64),
    ADD COLUMN doi_suffix_pattern VARCHAR(255) NOT NULL DEFAULT 'aj.{publicationId}',
    ADD COLUMN doi_auto_mint      BOOLEAN      NOT NULL DEFAULT FALSE;

ALTER TABLE doi DROP CONSTRAINT doi_status_check;
ALTER TABLE doi
    ADD CONSTRAINT doi_status_check
        CHECK (status IN ('NOT_REGISTERED','SUBMITTED','REGISTERED','ERROR','STALE'));
