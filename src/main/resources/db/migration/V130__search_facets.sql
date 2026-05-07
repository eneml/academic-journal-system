-- Add facet columns to the published search index. These complement the
-- existing year + section_id facets and support the public /search page's
-- refine sidebar (Year / Section / Type / Open Access).

ALTER TABLE published_search_index
    ADD COLUMN article_type VARCHAR(32) NOT NULL DEFAULT 'ARTICLE',
    ADD COLUMN open_access  BOOLEAN     NOT NULL DEFAULT TRUE;

CREATE INDEX idx_search_index_type ON published_search_index (article_type);
CREATE INDEX idx_search_index_oa   ON published_search_index (open_access);
