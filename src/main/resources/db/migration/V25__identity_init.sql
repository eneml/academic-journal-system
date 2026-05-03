-- =================================================================
-- identity module — users (lazy-provisioned from JWT) + role grants
-- =================================================================

-- ----------------------------------------------------------------
-- app_user: a local mirror of a Keycloak subject. Created on first
-- authenticated request via the JWT converter; identity claims keep
-- syncing on every login.
-- ----------------------------------------------------------------
CREATE TABLE app_user (
    id              BIGSERIAL    PRIMARY KEY,
    keycloak_sub    VARCHAR(64)  NOT NULL UNIQUE,
    email           CITEXT       NOT NULL UNIQUE,
    username        VARCHAR(128) UNIQUE,
    given_name      VARCHAR(128),
    family_name     VARCHAR(128),
    locale          VARCHAR(8)   NOT NULL DEFAULT 'en',
    country         VARCHAR(2),
    status          VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
    orcid_id        VARCHAR(19),
    biography       JSONB        NOT NULL DEFAULT '{}'::jsonb,
    affiliation     VARCHAR(512),
    public_url      VARCHAR(2048),
    signature       TEXT,
    gossip_note     TEXT,
    last_login_at   TIMESTAMPTZ,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT app_user_status_check
        CHECK (status IN ('ACTIVE', 'DISABLED', 'PENDING')),
    CONSTRAINT app_user_orcid_format_check
        CHECK (orcid_id IS NULL
               OR orcid_id ~ '^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$')
);

CREATE INDEX idx_app_user_orcid
    ON app_user (orcid_id) WHERE orcid_id IS NOT NULL;

CREATE INDEX idx_app_user_status
    ON app_user (status) WHERE status <> 'ACTIVE';

-- ----------------------------------------------------------------
-- user_role_assignment: locally tracked role grants. Authorities at
-- request time still come from the JWT realm roles (the source of
-- truth is Keycloak); this table records section-scoped grants and
-- audit history. scope_section_id is set only for SECTION_EDITOR.
--
-- (user_id, role, scope_section_id) is unique while date_revoked IS NULL,
-- so a user may hold the same role twice over time but never two active
-- copies of the same (role, scope) pair.
-- ----------------------------------------------------------------
CREATE TABLE user_role_assignment (
    id                  BIGSERIAL    PRIMARY KEY,
    user_id             BIGINT       NOT NULL
                        REFERENCES app_user(id) ON DELETE CASCADE,
    role                VARCHAR(32)  NOT NULL,
    scope_section_id    BIGINT,
    assigned_by_user_id BIGINT
                        REFERENCES app_user(id) ON DELETE SET NULL,
    date_assigned       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    date_revoked        TIMESTAMPTZ,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT user_role_assignment_role_check
        CHECK (role IN ('ADMIN', 'EDITOR', 'SECTION_EDITOR', 'AUTHOR',
                        'REVIEWER', 'PRODUCTION_STAFF')),
    CONSTRAINT user_role_assignment_scope_check
        CHECK ((role = 'SECTION_EDITOR' AND scope_section_id IS NOT NULL)
               OR (role <> 'SECTION_EDITOR' AND scope_section_id IS NULL))
);

CREATE UNIQUE INDEX uq_user_role_assignment_active_global
    ON user_role_assignment (user_id, role)
    WHERE date_revoked IS NULL AND scope_section_id IS NULL;

CREATE UNIQUE INDEX uq_user_role_assignment_active_scoped
    ON user_role_assignment (user_id, role, scope_section_id)
    WHERE date_revoked IS NULL AND scope_section_id IS NOT NULL;

CREATE INDEX idx_user_role_assignment_active_lookup
    ON user_role_assignment (user_id) WHERE date_revoked IS NULL;
