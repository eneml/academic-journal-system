-- =================================================================
-- email_template + email_template_locale — manager-editable templated
-- emails. One row per canonical key (e.g. 'submission.acknowledgement')
-- in `email_template`; one row per supported locale in
-- `email_template_locale`. Listeners that emit notifications resolve a
-- (key, locale) pair through `EmailTemplateService`, which falls back
-- user.locale → journal default → 'en'. Until a key has at least one
-- locale row, the listener that needs it falls back to its current
-- hardcoded behaviour and logs a warn — so this migration ships the
-- table shape without baking any default copy. Seed bodies land in a
-- follow-up migration after sign-off.
-- =================================================================

CREATE TABLE email_template (
    id            BIGSERIAL    PRIMARY KEY,
    key           VARCHAR(64)  NOT NULL UNIQUE,
    is_custom     BOOLEAN      NOT NULL DEFAULT FALSE,
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    description   TEXT,
    version       BIGINT       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT email_template_key_format
        CHECK (key ~ '^[a-z][a-zA-Z0-9.]+$')
);

CREATE INDEX idx_email_template_enabled
    ON email_template (enabled) WHERE enabled;

CREATE TABLE email_template_locale (
    template_id   BIGINT       NOT NULL
                  REFERENCES email_template(id) ON DELETE CASCADE,
    locale        VARCHAR(8)   NOT NULL,
    subject       VARCHAR(512) NOT NULL,
    body          TEXT         NOT NULL,
    version       BIGINT       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (template_id, locale)
);

CREATE INDEX idx_email_template_locale_template
    ON email_template_locale (template_id);
