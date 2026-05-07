-- Per-user reading list — what readers save from the public site to come
-- back to later. Powers the "Save" button on the article reading page.
CREATE TABLE user_library_item (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    publication_id  BIGINT       NOT NULL REFERENCES publication(id) ON DELETE CASCADE,
    saved_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    note            TEXT,
    UNIQUE (user_id, publication_id)
);

CREATE INDEX idx_library_user_saved
    ON user_library_item (user_id, saved_at DESC);
