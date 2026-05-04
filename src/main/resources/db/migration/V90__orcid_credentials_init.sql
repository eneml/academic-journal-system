-- =================================================================
-- Per-user ORCID OAuth credentials. After a member completes ORCID's
-- authorization-code flow, we receive an access token + refresh token
-- scoped to /activities/update which lets the integration module push
-- work records to api.orcid.org/v3.0/{orcid}/work on their behalf.
-- =================================================================

CREATE TABLE orcid_credentials (
    user_id         BIGINT       PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    orcid_id        VARCHAR(19)  NOT NULL,
    access_token    TEXT         NOT NULL,
    refresh_token   TEXT,
    scope           VARCHAR(255) NOT NULL DEFAULT '/activities/update',
    expires_at      TIMESTAMPTZ,
    last_pushed_at  TIMESTAMPTZ,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orcid_credentials_orcid ON orcid_credentials (orcid_id);
