-- =================================================================
-- notification_subscription_setting — per-user opt-out for templated
-- emails. The composite key (user_id, setting_key) defaults to "not
-- blocked" by absence of a row, so we only persist the explicit
-- decision the user made. The setting_key matches the canonical email
-- template key (e.g. 'decision.accept.notifyAuthor') so the dispatcher
-- can resolve both with one column.
--
-- Block scope: this table only suppresses *email* delivery. The in-app
-- notification still gets created and shows up in the feed — that way
-- a user who opted out of mail can still catch up on their dashboard
-- when they choose to.
-- =================================================================

CREATE TABLE notification_subscription_setting (
    user_id      BIGINT       NOT NULL
                 REFERENCES app_user(id) ON DELETE CASCADE,
    setting_key  VARCHAR(64)  NOT NULL,
    blocked      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, setting_key),
    CONSTRAINT notification_subscription_setting_key_format
        CHECK (setting_key ~ '^[a-z][a-zA-Z0-9.]+$')
);

CREATE INDEX idx_notification_subscription_setting_user
    ON notification_subscription_setting (user_id);
