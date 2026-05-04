-- =================================================================
-- Multi-author ORCID push: each ORCID deposit is scoped to one author's
-- OAuth credentials. The actor_user_id column tells the dispatcher
-- whose token to send the work record under.
-- For CROSSREF deposits the column is null (single registrant per
-- journal).
-- =================================================================

ALTER TABLE deposit_record
    ADD COLUMN actor_user_id BIGINT REFERENCES app_user(id) ON DELETE SET NULL;

CREATE INDEX idx_deposit_record_actor
    ON deposit_record (actor_user_id)
    WHERE actor_user_id IS NOT NULL;
