-- =================================================================
-- Extend the editorial_decision.decision_type CHECK to include the
-- four recommendation types (used by section editors operating under
-- a recommend_only stage assignment) plus the two revert types that
-- undo a previous decline. Old rows keep validating; new values
-- become legal as soon as the migration runs.
-- =================================================================

ALTER TABLE editorial_decision
    DROP CONSTRAINT IF EXISTS decision_type_check;

ALTER TABLE editorial_decision
    ADD CONSTRAINT decision_type_check CHECK (decision_type IN (
        'EXTERNAL_REVIEW','SKIP_REVIEW','INITIAL_DECLINE',
        'ACCEPT','DECLINE','REQUEST_REVISIONS','RESUBMIT_FOR_REVIEW',
        'NEW_REVIEW_ROUND','CANCEL_REVIEW_ROUND',
        'SEND_TO_PRODUCTION','BACK_FROM_PRODUCTION','BACK_FROM_COPYEDITING',
        'RECOMMEND_ACCEPT','RECOMMEND_DECLINE',
        'RECOMMEND_REVISIONS','RECOMMEND_RESUBMIT',
        'REVERT_DECLINE','REVERT_INITIAL_DECLINE'));
