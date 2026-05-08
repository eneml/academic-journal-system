-- =================================================================
-- Discussions — threaded conversations the editorial team holds about
-- a submission, scoped to the workflow stage they live in
-- (Submission triage / Review / Copyediting / Production). Participants
-- are explicitly listed; only listed users can see or post.
--
-- Three tables:
--   discussion              one thread per (submission, stage)
--   discussion_message      one post; flat list ordered by posted_at
--   discussion_participant  who can see the thread + receives alerts
-- =================================================================

CREATE TABLE discussion (
    id              BIGSERIAL    PRIMARY KEY,
    submission_id   BIGINT       NOT NULL
                    REFERENCES submission(id) ON DELETE CASCADE,
    stage           VARCHAR(32)  NOT NULL,
    subject         VARCHAR(512) NOT NULL,
    started_by_user_id BIGINT    NOT NULL
                    REFERENCES app_user(id) ON DELETE SET NULL,
    seq             INTEGER      NOT NULL DEFAULT 0,
    closed          BOOLEAN      NOT NULL DEFAULT FALSE,
    closed_at       TIMESTAMPTZ,
    date_started    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    date_modified   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT discussion_stage_check
        CHECK (stage IN ('SUBMISSION','EXTERNAL_REVIEW','EDITING','PRODUCTION','PUBLISHED'))
);

CREATE INDEX idx_discussion_submission_stage
    ON discussion (submission_id, stage, date_modified DESC);

CREATE INDEX idx_discussion_open
    ON discussion (submission_id, date_modified DESC)
    WHERE NOT closed;

CREATE TABLE discussion_message (
    id              BIGSERIAL    PRIMARY KEY,
    discussion_id   BIGINT       NOT NULL
                    REFERENCES discussion(id) ON DELETE CASCADE,
    author_user_id  BIGINT       NOT NULL
                    REFERENCES app_user(id) ON DELETE SET NULL,
    body            TEXT         NOT NULL,
    posted_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    edited_at       TIMESTAMPTZ,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discussion_message_thread
    ON discussion_message (discussion_id, posted_at);

CREATE TABLE discussion_participant (
    discussion_id   BIGINT       NOT NULL
                    REFERENCES discussion(id) ON DELETE CASCADE,
    user_id         BIGINT       NOT NULL
                    REFERENCES app_user(id) ON DELETE CASCADE,
    added_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_read_at    TIMESTAMPTZ,
    PRIMARY KEY (discussion_id, user_id)
);

CREATE INDEX idx_discussion_participant_user
    ON discussion_participant (user_id);

-- ----------------------------------------------------------------
-- Optional FK linking a submission_file row to the message that owns
-- it (replaces the assoc_type/assoc_id pattern OJS uses for note
-- attachments). UI for uploading attachments lands separately.
-- ----------------------------------------------------------------

ALTER TABLE submission_file
    ADD COLUMN discussion_message_id BIGINT
        REFERENCES discussion_message(id) ON DELETE SET NULL;

CREATE INDEX idx_submission_file_discussion_message
    ON submission_file (discussion_message_id)
    WHERE discussion_message_id IS NOT NULL;
