-- Per-issue article ordering for the editor curation drag-drop screen.
-- Display order resets per issue. Default 0 keeps existing rows stable; the
-- curation endpoint normalises to dense [0..n) on every reorder.

ALTER TABLE publication
    ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_publication_issue_order
    ON publication (issue_id, display_order)
    WHERE issue_id IS NOT NULL;
