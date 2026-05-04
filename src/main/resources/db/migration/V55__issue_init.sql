-- =================================================================
-- issue module — journal issues (volume / number / year, table of
-- contents, cover, publication-state)
-- =================================================================

CREATE TABLE issue (
    id                BIGSERIAL    PRIMARY KEY,
    volume            INTEGER,
    number            VARCHAR(32),
    year              INTEGER,
    title             JSONB        NOT NULL DEFAULT '{}'::jsonb,
    description       JSONB        NOT NULL DEFAULT '{}'::jsonb,
    cover_image_path  VARCHAR(2048),
    url_path          VARCHAR(255),
    show_volume       BOOLEAN      NOT NULL DEFAULT TRUE,
    show_number       BOOLEAN      NOT NULL DEFAULT TRUE,
    show_year         BOOLEAN      NOT NULL DEFAULT TRUE,
    show_title        BOOLEAN      NOT NULL DEFAULT TRUE,
    published         BOOLEAN      NOT NULL DEFAULT FALSE,
    date_published    TIMESTAMPTZ,
    access_status     VARCHAR(16)  NOT NULL DEFAULT 'OPEN',
    open_access_date  TIMESTAMPTZ,
    version           BIGINT       NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT issue_access_status_check
        CHECK (access_status IN ('OPEN','RESTRICTED'))
);

CREATE INDEX idx_issue_published
    ON issue (date_published DESC) WHERE published;
CREATE INDEX idx_issue_year_volume
    ON issue (year DESC, volume DESC, number DESC);
CREATE UNIQUE INDEX idx_issue_url_path
    ON issue (url_path) WHERE url_path IS NOT NULL;
