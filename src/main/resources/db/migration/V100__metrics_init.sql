-- Metrics module — view / download counters per publication.
--
-- A single row per publication keeps the schema cheap; every read or download
-- becomes a single SQL UPDATE that bumps the counter and stamps the
-- last_*_at timestamp. The row is created lazily by the metrics service on
-- the first event for a given publication, so we don't need to back-fill on
-- new publication insert.

CREATE TABLE publication_metrics (
    id                 BIGSERIAL PRIMARY KEY,
    publication_id     BIGINT       NOT NULL UNIQUE,
    view_count         BIGINT       NOT NULL DEFAULT 0,
    download_count     BIGINT       NOT NULL DEFAULT 0,
    last_viewed_at     TIMESTAMPTZ,
    last_downloaded_at TIMESTAMPTZ,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_publication_metrics_publication_id
    ON publication_metrics (publication_id);

-- Hot-paper ranking: keep an index on view_count DESC for "most read" lists
-- the public site might surface later. Cheap to maintain since the column
-- only ever increases.
CREATE INDEX idx_publication_metrics_views_desc
    ON publication_metrics (view_count DESC);

COMMENT ON TABLE publication_metrics IS
    'Per-publication view / download counters. Logical FK on publication_id; no DB-level FK to keep module boundaries clean.';
