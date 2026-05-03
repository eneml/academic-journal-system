-- =================================================================
-- review module — peer review rounds + reviewer assignments
-- =================================================================
-- A review_round groups all reviewer invitations for one (submission,
-- stage, round_number). Round 1 begins when an editor takes the
-- EXTERNAL_REVIEW decision. Subsequent rounds (round 2, 3, ...) get
-- created when an editor decides RESUBMIT_FOR_REVIEW.

CREATE TABLE review_round (
    id              BIGSERIAL    PRIMARY KEY,
    submission_id   BIGINT       NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
    stage           VARCHAR(32)  NOT NULL,
    round_number    INTEGER      NOT NULL CHECK (round_number > 0),
    status          VARCHAR(32)  NOT NULL DEFAULT 'PENDING_REVIEWERS',
    date_started    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    date_completed  TIMESTAMPTZ,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT review_round_stage_check
        CHECK (stage IN ('EXTERNAL_REVIEW')),
    CONSTRAINT review_round_status_check
        CHECK (status IN ('PENDING_REVIEWERS','IN_PROGRESS','COMPLETED','CANCELLED')),
    CONSTRAINT review_round_unique
        UNIQUE (submission_id, stage, round_number)
);

CREATE INDEX idx_review_round_submission ON review_round (submission_id);

-- ----------------------------------------------------------------
-- review_assignment: one reviewer's invitation. The status field
-- transitions: AWAITING_RESPONSE → ACCEPTED → IN_PROGRESS → COMPLETED
-- → CONFIRMED. Or short-circuits to DECLINED / CANCELLED.
-- ----------------------------------------------------------------
CREATE TABLE review_assignment (
    id                   BIGSERIAL    PRIMARY KEY,
    review_round_id      BIGINT       NOT NULL REFERENCES review_round(id) ON DELETE CASCADE,
    reviewer_user_id     BIGINT       NOT NULL REFERENCES app_user(id),
    review_method        VARCHAR(32)  NOT NULL DEFAULT 'ANONYMOUS',
    status               VARCHAR(32)  NOT NULL DEFAULT 'AWAITING_RESPONSE',
    recommendation       VARCHAR(32),
    comments_to_editor   TEXT,
    comments_to_author   TEXT,
    competing_interests  TEXT,
    date_assigned        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    date_notified        TIMESTAMPTZ,
    date_response_due    TIMESTAMPTZ,
    date_due             TIMESTAMPTZ,
    date_responded       TIMESTAMPTZ,
    date_completed       TIMESTAMPTZ,
    date_confirmed       TIMESTAMPTZ,
    invited_by_user_id   BIGINT       NOT NULL REFERENCES app_user(id),
    version              BIGINT       NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT review_method_check
        CHECK (review_method IN ('OPEN','ANONYMOUS','DOUBLE_ANONYMOUS')),
    CONSTRAINT review_assignment_status_check
        CHECK (status IN ('AWAITING_RESPONSE','ACCEPTED','DECLINED','IN_PROGRESS','COMPLETED','CONFIRMED','CANCELLED')),
    CONSTRAINT review_recommendation_check
        CHECK (recommendation IS NULL
               OR recommendation IN ('ACCEPT','REVISIONS','RESUBMIT','DECLINE','SEE_COMMENTS')),
    CONSTRAINT review_assignment_unique_active
        UNIQUE (review_round_id, reviewer_user_id)
);

CREATE INDEX idx_review_assignment_reviewer ON review_assignment (reviewer_user_id);
CREATE INDEX idx_review_assignment_round ON review_assignment (review_round_id);
CREATE INDEX idx_review_assignment_open
    ON review_assignment (reviewer_user_id, status)
    WHERE status NOT IN ('DECLINED','CANCELLED','CONFIRMED');
