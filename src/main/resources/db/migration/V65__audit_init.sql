-- =================================================================
-- audit module — append-only event log
-- =================================================================

CREATE TABLE event_log (
    id            BIGSERIAL    PRIMARY KEY,
    event_type    VARCHAR(128) NOT NULL,
    submission_id BIGINT,
    actor_user_id BIGINT,
    payload       JSONB        NOT NULL DEFAULT '{}'::jsonb,
    occurred_at   TIMESTAMPTZ  NOT NULL,
    recorded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_log_submission
    ON event_log (submission_id, occurred_at DESC);

CREATE INDEX idx_event_log_type
    ON event_log (event_type, occurred_at DESC);

CREATE INDEX idx_event_log_actor
    ON event_log (actor_user_id, occurred_at DESC) WHERE actor_user_id IS NOT NULL;
