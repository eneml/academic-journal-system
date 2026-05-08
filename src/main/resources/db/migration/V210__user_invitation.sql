-- =================================================================
-- Phase 20 — invitations to users who don't have an account yet.
--   type:      kind of invitation (REVIEWER, EDITOR, …) — drives which
--              role grants happen on accept and which mailable to use.
--   email:     destination — citext to match Keycloak/app_user.
--   key_hash:  SHA-256 of the random secret embedded in the link.
--   payload:   opaque JSON the issuer attaches (e.g. submissionId so the
--              reviewer can be auto-assigned on accept).
--   status:    PENDING → ACCEPTED | DECLINED | EXPIRED | CANCELLED.
-- =================================================================

CREATE TABLE user_invitation (
    id           BIGSERIAL    PRIMARY KEY,
    type         VARCHAR(32)  NOT NULL,
    email        CITEXT       NOT NULL,
    payload      JSONB        NOT NULL DEFAULT '{}'::jsonb,
    status       VARCHAR(16)  NOT NULL DEFAULT 'PENDING',
    key_hash     VARCHAR(128) NOT NULL UNIQUE,
    invited_by_user_id BIGINT NOT NULL REFERENCES app_user(id),
    accepted_user_id   BIGINT REFERENCES app_user(id),
    expires_at   TIMESTAMPTZ  NOT NULL,
    accepted_at  TIMESTAMPTZ,
    version      BIGINT       NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT user_invitation_status_check
        CHECK (status IN ('PENDING','ACCEPTED','DECLINED','EXPIRED','CANCELLED')),
    CONSTRAINT user_invitation_type_check
        CHECK (type IN ('REVIEWER','EDITOR','SECTION_EDITOR','AUTHOR','OTHER'))
);

CREATE INDEX idx_user_invitation_email_status
    ON user_invitation (email, status);

CREATE INDEX idx_user_invitation_pending_expiry
    ON user_invitation (expires_at) WHERE status = 'PENDING';
