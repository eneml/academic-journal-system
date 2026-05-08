-- =================================================================
-- Phase 17 — homepage highlights / featured cards. Each row is a
-- curated tile that replaces a slot in the "most recent" hardcoded
-- section. Sort_order ASC drives display order.
-- =================================================================

CREATE TABLE highlight (
    id                       BIGSERIAL    PRIMARY KEY,
    sort_order               INT          NOT NULL DEFAULT 0,
    title                    JSONB        NOT NULL DEFAULT '{}'::jsonb,
    description              JSONB        NOT NULL DEFAULT '{}'::jsonb,
    url                      VARCHAR(2048),
    image_stored_file_id     BIGINT,
    target_publication_id    BIGINT,
    enabled                  BOOLEAN      NOT NULL DEFAULT TRUE,
    version                  BIGINT       NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_highlight_enabled_sort
    ON highlight (sort_order, id) WHERE enabled;
