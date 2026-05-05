-- =================================================================
-- issue module — bind issue covers to the storage module's stored_file
-- table so editors can upload a cover image when creating an issue.
--
-- The original schema only had a free-form `cover_image_path` string.
-- That worked when covers were external URLs but it didn't give us
-- ownership of the underlying object (no soft-delete, no presigned URLs,
-- no sha-checking). We add a real FK to stored_file and let
-- IssueController mint a presigned URL on read. `cover_image_path` is
-- kept for any rows that may already point at an external URL — readers
-- prefer cover_file_id when both are set.
-- =================================================================

ALTER TABLE issue
    ADD COLUMN cover_file_id BIGINT REFERENCES stored_file(id) ON DELETE SET NULL;

CREATE INDEX idx_issue_cover_file ON issue (cover_file_id) WHERE cover_file_id IS NOT NULL;
