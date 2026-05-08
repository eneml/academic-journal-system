-- =================================================================
-- category — hierarchical, multilingual taxonomy that publications
-- opt into. Public-site browsing, faceted search, and editorial
-- subject grouping all key off this table.
--
-- parent_id is a self-FK; root categories carry parent_id=NULL.
-- path is a URL-friendly slug, unique within the journal.
-- =================================================================

CREATE TABLE category (
    id              BIGSERIAL    PRIMARY KEY,
    parent_id       BIGINT       REFERENCES category(id) ON DELETE SET NULL,
    code            VARCHAR(64)  NOT NULL UNIQUE,
    path            VARCHAR(255) NOT NULL UNIQUE,
    sequence        DOUBLE PRECISION NOT NULL DEFAULT 0,
    title           JSONB        NOT NULL DEFAULT '{}'::jsonb,
    description     JSONB        NOT NULL DEFAULT '{}'::jsonb,
    sort_option     VARCHAR(32)  NOT NULL DEFAULT 'date_published_desc',
    image_file_id   BIGINT       REFERENCES stored_file(id) ON DELETE SET NULL,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT category_code_format
        CHECK (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT category_path_format
        CHECK (path ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT category_sort_check
        CHECK (sort_option IN (
            'date_published_desc',
            'date_published_asc',
            'title_asc',
            'manual'))
);

CREATE INDEX idx_category_parent
    ON category (parent_id, sequence);

CREATE INDEX idx_category_root
    ON category (sequence) WHERE parent_id IS NULL;

-- ----------------------------------------------------------------
-- publication_category — many-to-many between published renditions
-- and the categories they appear under. Cascade on either side so a
-- deleted publication / category disappears from the join cleanly.
-- ----------------------------------------------------------------

CREATE TABLE publication_category (
    publication_id  BIGINT       NOT NULL
                    REFERENCES publication(id) ON DELETE CASCADE,
    category_id     BIGINT       NOT NULL
                    REFERENCES category(id) ON DELETE CASCADE,
    PRIMARY KEY (publication_id, category_id)
);

CREATE INDEX idx_publication_category_category
    ON publication_category (category_id);
