-- =================================================================
-- reviewer_suggestion — names + emails the submitting author proposes
-- as potential peer reviewers. Editors review the list during triage
-- and may approve a suggestion, which records the timestamp here and
-- (optionally) links to an existing app_user. Turning the approved row
-- into an actual review_assignment is a separate step done from the
-- editor's reviewer-invite form.
--
-- A site-level flag controls whether the wizard exposes this section
-- to authors at all — some journals don't accept author suggestions.
-- =================================================================

CREATE TABLE reviewer_suggestion (
    id                  BIGSERIAL    PRIMARY KEY,
    submission_id       BIGINT       NOT NULL
                        REFERENCES submission(id) ON DELETE CASCADE,
    given_name          VARCHAR(255) NOT NULL,
    family_name         VARCHAR(255),
    email               CITEXT       NOT NULL,
    orcid_id            VARCHAR(19),
    affiliation         VARCHAR(512),
    suggestion_reason   TEXT,
    existing_user_id    BIGINT       REFERENCES app_user(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    approved_by_user_id BIGINT       REFERENCES app_user(id) ON DELETE SET NULL,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT reviewer_suggestion_orcid_check
        CHECK (orcid_id IS NULL OR orcid_id ~ '^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$')
);

CREATE INDEX idx_reviewer_suggestion_submission
    ON reviewer_suggestion (submission_id);

CREATE INDEX idx_reviewer_suggestion_email
    ON reviewer_suggestion (email);

-- ----------------------------------------------------------------
-- Site-level toggle on journal_config. When false, the wizard hides
-- the section entirely and the API rejects writes from non-editor
-- users (editors can still attach suggestions on behalf of authors).
-- ----------------------------------------------------------------

ALTER TABLE journal_config
    ADD COLUMN reviewer_suggestions_enabled BOOLEAN NOT NULL DEFAULT TRUE;
