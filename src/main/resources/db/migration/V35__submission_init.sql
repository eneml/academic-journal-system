-- =================================================================
-- submission module — manuscripts, contributors, files
-- =================================================================
-- A submission is the persistent shell that survives the entire
-- editorial workflow. Draft metadata (title/abstract/keywords) lives
-- on this row during the wizard and gets promoted into a Publication
-- when the editor accepts the work.

CREATE TABLE submission (
    id                       BIGSERIAL    PRIMARY KEY,
    section_id               BIGINT       NOT NULL REFERENCES journal_section(id),
    stage                    VARCHAR(32)  NOT NULL DEFAULT 'SUBMISSION',
    status                   VARCHAR(16)  NOT NULL DEFAULT 'DRAFT',
    progress                 VARCHAR(16)  NOT NULL DEFAULT 'START',
    locale                   VARCHAR(8)   NOT NULL DEFAULT 'en',
    submitted_by_user_id     BIGINT       NOT NULL REFERENCES app_user(id),
    comments_to_editor       TEXT,
    title                    JSONB        NOT NULL DEFAULT '{}'::jsonb,
    abstract                 JSONB        NOT NULL DEFAULT '{}'::jsonb,
    keywords                 JSONB        NOT NULL DEFAULT '[]'::jsonb,
    disciplines              JSONB        NOT NULL DEFAULT '[]'::jsonb,
    references_raw           TEXT,
    date_submitted           TIMESTAMPTZ,
    date_last_activity       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    version                  BIGINT       NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT submission_stage_check
        CHECK (stage IN ('SUBMISSION','EXTERNAL_REVIEW','EDITING','PRODUCTION','PUBLISHED')),
    CONSTRAINT submission_status_check
        CHECK (status IN ('DRAFT','QUEUED','PUBLISHED','DECLINED','SCHEDULED')),
    CONSTRAINT submission_progress_check
        CHECK (progress IN ('START','DETAILS','FILES','CONTRIBUTORS','EDITORS','REVIEW','SUBMITTED'))
);

CREATE INDEX idx_submission_status ON submission (status);
CREATE INDEX idx_submission_stage_active
    ON submission (stage) WHERE status NOT IN ('DRAFT', 'PUBLISHED', 'DECLINED');
CREATE INDEX idx_submission_submitter ON submission (submitted_by_user_id);
CREATE INDEX idx_submission_section ON submission (section_id);

-- ----------------------------------------------------------------
-- submission_author: contributors as captured at submission time.
-- user_id is optional — many authors don't have a Keycloak account.
-- ----------------------------------------------------------------
CREATE TABLE submission_author (
    id                       BIGSERIAL    PRIMARY KEY,
    submission_id            BIGINT       NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
    seq                      INTEGER      NOT NULL DEFAULT 0,
    given_name               VARCHAR(255) NOT NULL,
    family_name              VARCHAR(255),
    email                    CITEXT       NOT NULL,
    orcid_id                 VARCHAR(19),
    affiliation              VARCHAR(512),
    biography                JSONB        NOT NULL DEFAULT '{}'::jsonb,
    country                  VARCHAR(2),
    is_corresponding         BOOLEAN      NOT NULL DEFAULT FALSE,
    include_in_browse        BOOLEAN      NOT NULL DEFAULT TRUE,
    user_id                  BIGINT       REFERENCES app_user(id) ON DELETE SET NULL,
    version                  BIGINT       NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT submission_author_orcid_check
        CHECK (orcid_id IS NULL OR orcid_id ~ '^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$')
);

CREATE INDEX idx_submission_author_seq ON submission_author (submission_id, seq);
CREATE INDEX idx_submission_author_email ON submission_author (email);

-- ----------------------------------------------------------------
-- submission_file: workflow-typed reference to a stored file.
-- Same StoredFile may be referenced from multiple SubmissionFile rows
-- across stages (review file → final → production-ready).
-- ----------------------------------------------------------------
CREATE TABLE submission_file (
    id                          BIGSERIAL    PRIMARY KEY,
    submission_id               BIGINT       NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
    stored_file_id              BIGINT       NOT NULL REFERENCES stored_file(id),
    genre_id                    BIGINT       NOT NULL REFERENCES journal_genre(id),
    file_stage                  VARCHAR(32)  NOT NULL,
    source_submission_file_id   BIGINT       REFERENCES submission_file(id) ON DELETE SET NULL,
    uploader_user_id            BIGINT       NOT NULL REFERENCES app_user(id),
    locale                      VARCHAR(8),
    label                       JSONB        NOT NULL DEFAULT '{}'::jsonb,
    description                 JSONB        NOT NULL DEFAULT '{}'::jsonb,
    viewable                    BOOLEAN      NOT NULL DEFAULT TRUE,
    version                     BIGINT       NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT submission_file_stage_check
        CHECK (file_stage IN (
            'SUBMISSION','REVIEW_FILE','REVIEW_ATTACHMENT','REVIEW_REVISION',
            'FINAL','COPYEDIT','PROOF','PRODUCTION_READY','DEPENDENT',
            'QUERY_ATTACHMENT','JATS','NOTE'))
);

CREATE INDEX idx_submission_file_stage ON submission_file (submission_id, file_stage);
CREATE INDEX idx_submission_file_stored ON submission_file (stored_file_id);
