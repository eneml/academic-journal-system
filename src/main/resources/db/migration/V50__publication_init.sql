-- =================================================================
-- publication module — versioned, citable rendition of a submission
-- =================================================================
-- A Publication is what readers actually see. One Submission may have
-- multiple Publications (version 1, 2, ...) — corrections, addenda,
-- republications. When a new version is created, metadata is cloned
-- from the previous one; the older versions remain accessible at
-- versioned URLs.

CREATE TABLE publication (
    id                   BIGSERIAL    PRIMARY KEY,
    submission_id        BIGINT       NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
    version_number       INTEGER      NOT NULL CHECK (version_number > 0),
    status               VARCHAR(16)  NOT NULL DEFAULT 'DRAFT',
    access_status        VARCHAR(16)  NOT NULL DEFAULT 'OPEN',
    section_id           BIGINT       NOT NULL REFERENCES journal_section(id),
    issue_id             BIGINT,
    primary_author_email VARCHAR(254),
    url_path             VARCHAR(255),
    license_url          VARCHAR(2048),
    copyright_holder     VARCHAR(512),
    copyright_year       INTEGER,
    pages                VARCHAR(64),
    title                JSONB        NOT NULL DEFAULT '{}'::jsonb,
    abstract             JSONB        NOT NULL DEFAULT '{}'::jsonb,
    keywords             JSONB        NOT NULL DEFAULT '[]'::jsonb,
    disciplines          JSONB        NOT NULL DEFAULT '[]'::jsonb,
    locale               VARCHAR(8)   NOT NULL DEFAULT 'en',
    date_published       TIMESTAMPTZ,
    version              BIGINT       NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT publication_status_check
        CHECK (status IN ('DRAFT','SCHEDULED','PUBLISHED','UNPUBLISHED')),
    CONSTRAINT publication_access_status_check
        CHECK (access_status IN ('OPEN','RESTRICTED')),
    CONSTRAINT publication_unique_version_number
        UNIQUE (submission_id, version_number)
);

CREATE INDEX idx_publication_submission ON publication (submission_id);
CREATE INDEX idx_publication_published
    ON publication (date_published) WHERE status = 'PUBLISHED';
CREATE INDEX idx_publication_section
    ON publication (section_id) WHERE status = 'PUBLISHED';
CREATE UNIQUE INDEX idx_publication_url_path
    ON publication (url_path) WHERE url_path IS NOT NULL;
