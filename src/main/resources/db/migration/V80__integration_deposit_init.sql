-- =================================================================
-- Outbound metadata deposits: tracks every attempt to push a
-- publication's metadata to an external service (CrossRef, ORCID).
-- A row is enqueued by an event listener on PublicationPublished /
-- DoiAssigned and processed by a scheduled worker.
-- =================================================================

CREATE TABLE deposit_record (
    id                  BIGSERIAL    PRIMARY KEY,
    target              VARCHAR(32)  NOT NULL,
    subject_type        VARCHAR(32)  NOT NULL,
    subject_id          BIGINT       NOT NULL,
    external_ref        VARCHAR(255),
    status              VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
    attempts            INTEGER      NOT NULL DEFAULT 0,
    last_attempt_at     TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    payload             TEXT,
    response            TEXT,
    error_message       TEXT,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT deposit_record_target_check
        CHECK (target IN ('CROSSREF','ORCID')),
    CONSTRAINT deposit_record_subject_check
        CHECK (subject_type IN ('PUBLICATION','GALLEY','ISSUE')),
    CONSTRAINT deposit_record_status_check
        CHECK (status IN ('PENDING','SENT','ACCEPTED','FAILED','SKIPPED'))
);

CREATE INDEX idx_deposit_record_pending
    ON deposit_record (status, target, created_at)
    WHERE status = 'PENDING';

CREATE INDEX idx_deposit_record_subject
    ON deposit_record (subject_type, subject_id);
