-- =================================================================
-- Per-day, per-publication, per-format metrics rollup. Powers the
-- OJS-style admin Statistics → Articles page (time-series chart +
-- paginated per-article breakdown by format).
-- =================================================================

CREATE TABLE publication_metric_daily (
    id              BIGSERIAL    PRIMARY KEY,
    publication_id  BIGINT       NOT NULL,
    day             DATE         NOT NULL,
    abstract_views  BIGINT       NOT NULL DEFAULT 0,
    pdf_views       BIGINT       NOT NULL DEFAULT 0,
    html_views      BIGINT       NOT NULL DEFAULT 0,
    other_views     BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT publication_metric_daily_unique UNIQUE (publication_id, day)
);

CREATE INDEX idx_publication_metric_daily_day
    ON publication_metric_daily (day);
CREATE INDEX idx_publication_metric_daily_pub_day
    ON publication_metric_daily (publication_id, day);
