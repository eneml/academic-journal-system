-- =================================================================
-- One-shot backfill: seed publication_metric_daily from the cumulative
-- publication_metrics rows so the admin Statistics chart has data for
-- views and downloads recorded before V115 introduced daily tracking.
--
-- Pre-V115 we only knew the cumulative count + last activity timestamp,
-- so each publication's pre-migration counts get parked on its
-- last_viewed_at / last_downloaded_at day. Slightly synthetic but
-- better than rendering an empty chart on day one.
-- =================================================================

INSERT INTO publication_metric_daily
    (publication_id, day, abstract_views, pdf_views, html_views, other_views,
     created_at, updated_at)
SELECT
    publication_id,
    last_viewed_at::date,
    view_count,
    0, 0, 0,
    NOW(), NOW()
FROM publication_metrics
WHERE view_count > 0 AND last_viewed_at IS NOT NULL
ON CONFLICT (publication_id, day) DO UPDATE SET
    abstract_views = publication_metric_daily.abstract_views + EXCLUDED.abstract_views,
    updated_at = NOW();

-- Downloads: we don't know which format the historical downloads were,
-- so they all get parked under other_views. Going forward each download
-- gets attributed to its actual format kind.
INSERT INTO publication_metric_daily
    (publication_id, day, abstract_views, pdf_views, html_views, other_views,
     created_at, updated_at)
SELECT
    publication_id,
    last_downloaded_at::date,
    0,
    0, 0,
    download_count,
    NOW(), NOW()
FROM publication_metrics
WHERE download_count > 0 AND last_downloaded_at IS NOT NULL
ON CONFLICT (publication_id, day) DO UPDATE SET
    other_views = publication_metric_daily.other_views + EXCLUDED.other_views,
    updated_at = NOW();
