-- =================================================================
-- stage_assignment — who is involved in each stage of a submission's
-- editorial workflow. The (submission_id, stage) tuple groups the
-- people the workflow page should render in its Participants panel:
--   - the AUTHOR who submitted the work
--   - one or more EDITORs / SECTION_EDITORs handling the stage
--   - PRODUCTION_STAFF for the production stage
--
-- REVIEWERs live in review_assignment (per-round, per-recommendation)
-- and are not duplicated here — they're a separate concern.
--
-- can_change_metadata flags an editor allowed to edit the publication
-- metadata at this stage; recommend_only flags a section editor whose
-- decisions land as recommendations rather than terminal calls.
-- =================================================================

CREATE TABLE stage_assignment (
    id                    BIGSERIAL    PRIMARY KEY,
    submission_id         BIGINT       NOT NULL
                          REFERENCES submission(id) ON DELETE CASCADE,
    stage                 VARCHAR(32)  NOT NULL,
    user_id               BIGINT       NOT NULL
                          REFERENCES app_user(id) ON DELETE CASCADE,
    role                  VARCHAR(32)  NOT NULL,
    can_change_metadata   BOOLEAN      NOT NULL DEFAULT FALSE,
    recommend_only        BOOLEAN      NOT NULL DEFAULT FALSE,
    date_assigned         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    assigned_by_user_id   BIGINT       REFERENCES app_user(id) ON DELETE SET NULL,
    version               BIGINT       NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT stage_assignment_stage_check
        CHECK (stage IN ('SUBMISSION','EXTERNAL_REVIEW','EDITING','PRODUCTION','PUBLISHED')),
    CONSTRAINT stage_assignment_role_check
        CHECK (role IN ('EDITOR','SECTION_EDITOR','AUTHOR','PRODUCTION_STAFF')),
    CONSTRAINT stage_assignment_recommend_check
        CHECK (recommend_only = FALSE OR role IN ('SECTION_EDITOR'))
);

CREATE UNIQUE INDEX uq_stage_assignment_unique
    ON stage_assignment (submission_id, stage, user_id, role);

CREATE INDEX idx_stage_assignment_submission
    ON stage_assignment (submission_id, stage);

CREATE INDEX idx_stage_assignment_user
    ON stage_assignment (user_id, stage);

-- ----------------------------------------------------------------
-- Backfill: seed the canonical participants from existing data so
-- the workflow page has something to show on day one.
--   * AUTHOR for every submission, scoped to the current stage of
--     that submission.
--   * EDITOR derived from the most recent decision per submission.
-- Both writes are idempotent via ON CONFLICT.
-- ----------------------------------------------------------------

INSERT INTO stage_assignment (submission_id, stage, user_id, role)
SELECT id, stage, submitted_by_user_id, 'AUTHOR'
FROM submission
WHERE submitted_by_user_id IS NOT NULL
ON CONFLICT (submission_id, stage, user_id, role) DO NOTHING;

INSERT INTO stage_assignment (submission_id, stage, user_id, role, can_change_metadata)
SELECT DISTINCT ON (d.submission_id)
       d.submission_id,
       d.new_stage,
       d.decided_by_user_id,
       'EDITOR',
       TRUE
FROM editorial_decision d
ORDER BY d.submission_id, d.date_decided DESC
ON CONFLICT (submission_id, stage, user_id, role) DO NOTHING;
