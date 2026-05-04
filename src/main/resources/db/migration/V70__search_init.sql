-- =================================================================
-- search module — denormalized full-text index on published works.
-- Fed by event listeners (PublicationPublished / PublicationUnpublished).
-- =================================================================

CREATE TABLE published_search_index (
    publication_id  BIGINT       PRIMARY KEY REFERENCES publication(id) ON DELETE CASCADE,
    submission_id   BIGINT       NOT NULL,
    section_id      BIGINT       NOT NULL,
    issue_id        BIGINT,
    year            INTEGER,
    locale          VARCHAR(8),
    title_text      TEXT         NOT NULL,
    abstract_text   TEXT,
    keywords_text   TEXT,
    searchable      tsvector     NOT NULL,
    date_published  TIMESTAMPTZ,
    indexed_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_index_fts ON published_search_index USING GIN (searchable);
CREATE INDEX idx_search_index_section ON published_search_index (section_id);
CREATE INDEX idx_search_index_year ON published_search_index (year DESC);
CREATE INDEX idx_search_index_published ON published_search_index (date_published DESC);
