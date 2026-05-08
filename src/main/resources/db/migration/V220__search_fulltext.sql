-- =================================================================
-- Phase 22 — extend the search index with full-text content extracted
-- from the approved galley. The text is appended to the searchable
-- tsvector with a lower weight than title/abstract, so a phrase from
-- the body still surfaces the article without drowning out matches in
-- the title.
-- =================================================================

ALTER TABLE published_search_index
    ADD COLUMN fulltext_text TEXT;
