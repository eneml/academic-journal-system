package com.eneml.ajs.metrics.api;

/**
 * One time-series bucket for the admin Statistics chart. The {@code key} is
 * either an ISO date {@code YYYY-MM-DD} (when the caller asked for daily
 * granularity) or {@code YYYY-MM} (when the caller asked for monthly).
 */
public record DailyMetricsBucket(String key, long abstracts, long files) {
}
