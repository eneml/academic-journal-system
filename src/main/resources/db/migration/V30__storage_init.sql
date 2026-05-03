-- =================================================================
-- storage module — content-addressable file store backed by S3
-- =================================================================
-- Tracks every uploaded file across the system. Other modules reference
-- a stored file by its id; the s3_key is the only module-internal
-- handle. sha256 + size_bytes give us deduplication potential and
-- integrity checks. Soft-delete via deleted_at — async sweep removes
-- the actual S3 object later.

CREATE TABLE stored_file (
    id                  BIGSERIAL    PRIMARY KEY,
    s3_key              VARCHAR(1024) NOT NULL UNIQUE,
    content_type        VARCHAR(255) NOT NULL,
    size_bytes          BIGINT       NOT NULL CHECK (size_bytes >= 0),
    sha256              VARCHAR(64)  NOT NULL,
    original_filename   VARCHAR(512),
    uploaded_by_user_id BIGINT,
    deleted_at          TIMESTAMPTZ,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stored_file_sha256 ON stored_file (sha256);

CREATE INDEX idx_stored_file_uploader
    ON stored_file (uploaded_by_user_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_stored_file_pending_deletion
    ON stored_file (deleted_at) WHERE deleted_at IS NOT NULL;
