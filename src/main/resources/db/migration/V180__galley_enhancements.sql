-- =================================================================
-- Phase 14 — galley enhancements.
--   submission_file: parent_submission_file_id self-FK so HTML galleys
--     can carry CSS / image dependents that get URL-rewritten on serve.
--   publication_galley: publisher_id captures who hit Approve so the
--     audit trail / RSS feeds can credit them.
-- =================================================================

ALTER TABLE submission_file
    ADD COLUMN parent_submission_file_id BIGINT;

ALTER TABLE submission_file
    ADD CONSTRAINT submission_file_parent_fkey
        FOREIGN KEY (parent_submission_file_id)
        REFERENCES submission_file(id) ON DELETE CASCADE;

CREATE INDEX idx_submission_file_parent
    ON submission_file (parent_submission_file_id)
    WHERE parent_submission_file_id IS NOT NULL;

ALTER TABLE publication_galley
    ADD COLUMN publisher_id BIGINT;

CREATE INDEX idx_publication_galley_publisher
    ON publication_galley (publisher_id)
    WHERE publisher_id IS NOT NULL;
