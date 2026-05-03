-- =================================================================
-- editorial module — decisions log + workflow engine state
-- =================================================================

CREATE TABLE editorial_decision (
    id                BIGSERIAL    PRIMARY KEY,
    submission_id     BIGINT       NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
    review_round_id   BIGINT       REFERENCES review_round(id) ON DELETE SET NULL,
    decision_type     VARCHAR(40)  NOT NULL,
    previous_stage    VARCHAR(32)  NOT NULL,
    new_stage         VARCHAR(32)  NOT NULL,
    new_status        VARCHAR(16)  NOT NULL,
    decided_by_user_id BIGINT      NOT NULL REFERENCES app_user(id),
    summary           TEXT,
    date_decided      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    version           BIGINT       NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT decision_type_check CHECK (decision_type IN (
        'EXTERNAL_REVIEW','SKIP_REVIEW','INITIAL_DECLINE',
        'ACCEPT','DECLINE','REQUEST_REVISIONS','RESUBMIT_FOR_REVIEW',
        'NEW_REVIEW_ROUND','CANCEL_REVIEW_ROUND',
        'SEND_TO_PRODUCTION','BACK_FROM_PRODUCTION','BACK_FROM_COPYEDITING'))
);

CREATE INDEX idx_editorial_decision_submission ON editorial_decision (submission_id, date_decided);
CREATE INDEX idx_editorial_decision_actor ON editorial_decision (decided_by_user_id);
