-- =================================================================
-- Phase 16 — issue galleys.
-- Each issue can carry one or more downloadable renditions (combined
-- PDF, EPUB, mobi). Either a stored_file_id (uploaded into MinIO) or
-- a remote_url (CDN-hosted). DOI optional — registered via the same
-- doi table as publications/galleys.
-- =================================================================

CREATE TABLE issue_galley (
    id              BIGSERIAL    PRIMARY KEY,
    issue_id        BIGINT       NOT NULL REFERENCES issue(id) ON DELETE CASCADE,
    stored_file_id  BIGINT,
    remote_url      VARCHAR(2048),
    locale          VARCHAR(8),
    label           JSONB        NOT NULL DEFAULT '{}'::jsonb,
    seq             INT          NOT NULL DEFAULT 0,
    is_approved     BOOLEAN      NOT NULL DEFAULT FALSE,
    doi_id          BIGINT       REFERENCES doi(id),
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT issue_galley_source_check CHECK (
        (stored_file_id IS NOT NULL AND remote_url IS NULL)
     OR (stored_file_id IS NULL AND remote_url IS NOT NULL)
    )
);

CREATE INDEX idx_issue_galley_issue_seq
    ON issue_galley (issue_id, seq, id);
