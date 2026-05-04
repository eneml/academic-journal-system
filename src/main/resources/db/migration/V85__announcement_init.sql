-- =================================================================
-- Editorial announcements: short messages shown on the public site,
-- e.g. calls for papers, journal news, special-issue invitations.
-- =================================================================

CREATE TABLE announcement (
    id              BIGSERIAL    PRIMARY KEY,
    type            VARCHAR(32)  NOT NULL DEFAULT 'GENERAL',
    title           JSONB        NOT NULL DEFAULT '{}'::jsonb,
    body            JSONB        NOT NULL DEFAULT '{}'::jsonb,
    url_path        VARCHAR(255) UNIQUE,
    date_posted     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    date_expires    TIMESTAMPTZ,
    pinned          BOOLEAN      NOT NULL DEFAULT FALSE,
    visible         BOOLEAN      NOT NULL DEFAULT TRUE,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT announcement_type_check
        CHECK (type IN ('GENERAL','CALL_FOR_PAPERS','SPECIAL_ISSUE','POLICY'))
);

CREATE INDEX idx_announcement_visible_pinned_posted
    ON announcement (visible, pinned DESC, date_posted DESC);
