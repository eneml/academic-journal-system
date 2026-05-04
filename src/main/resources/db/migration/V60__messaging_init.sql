-- =================================================================
-- messaging module — in-app notifications. Email delivery is added in
-- a follow-up migration (V6x).
-- =================================================================

CREATE TABLE notification (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    type         VARCHAR(64)  NOT NULL,
    level        VARCHAR(16)  NOT NULL DEFAULT 'NORMAL',
    title        VARCHAR(512) NOT NULL,
    body         TEXT,
    assoc_type   VARCHAR(64),
    assoc_id     BIGINT,
    href         VARCHAR(2048),
    read_at      TIMESTAMPTZ,
    version      BIGINT       NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT notification_level_check
        CHECK (level IN ('TRIVIAL','NORMAL','TASK'))
);

CREATE INDEX idx_notification_user_unread
    ON notification (user_id, created_at DESC) WHERE read_at IS NULL;

CREATE INDEX idx_notification_user_all
    ON notification (user_id, created_at DESC);
