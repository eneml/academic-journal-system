-- =================================================================
-- Galleys (renditions of a publication) + first-class DOI table.
-- A galley wraps either an internal stored file (PDF/HTML/JATS) or a
-- remote URL. DOI is its own table so a publication, an issue, or a
-- single galley can each carry a registered identifier.
-- =================================================================

CREATE TABLE doi (
    id              BIGSERIAL    PRIMARY KEY,
    doi             VARCHAR(255) NOT NULL UNIQUE,
    status          VARCHAR(32)  NOT NULL DEFAULT 'NOT_REGISTERED',
    registered_at   TIMESTAMPTZ,
    error_message   TEXT,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT doi_status_check
        CHECK (status IN ('NOT_REGISTERED','SUBMITTED','REGISTERED','ERROR'))
);

ALTER TABLE publication
    ADD COLUMN doi_id BIGINT REFERENCES doi(id) ON DELETE SET NULL;

ALTER TABLE issue
    ADD COLUMN doi_id BIGINT REFERENCES doi(id) ON DELETE SET NULL;

CREATE TABLE publication_galley (
    id                  BIGSERIAL    PRIMARY KEY,
    publication_id      BIGINT       NOT NULL REFERENCES publication(id) ON DELETE CASCADE,
    submission_file_id  BIGINT       REFERENCES submission_file(id) ON DELETE SET NULL,
    remote_url          VARCHAR(2048),
    locale              VARCHAR(8),
    label               JSONB        NOT NULL DEFAULT '{}'::jsonb,
    seq                 INTEGER      NOT NULL DEFAULT 0,
    is_approved         BOOLEAN      NOT NULL DEFAULT FALSE,
    url_path            VARCHAR(255),
    doi_id              BIGINT       REFERENCES doi(id) ON DELETE SET NULL,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT publication_galley_source_check CHECK (
        submission_file_id IS NOT NULL OR remote_url IS NOT NULL
    )
);

CREATE INDEX idx_publication_galley_pub
    ON publication_galley (publication_id, seq, id);

CREATE UNIQUE INDEX idx_publication_galley_url_path
    ON publication_galley (publication_id, url_path)
    WHERE url_path IS NOT NULL;
