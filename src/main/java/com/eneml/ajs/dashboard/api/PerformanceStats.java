package com.eneml.ajs.dashboard.api;

import java.util.List;

/**
 * Time-to-decision distribution for the Performance card.
 *
 * @param sampleSize   number of decisions counted
 * @param p50Days      median days from submission to first ACCEPT/DECLINE
 * @param p90Days      90th percentile
 * @param meanDays     arithmetic mean (rounded)
 * @param slaTargetDays target the journal aims for (default 90 days)
 * @param slaOnTimePct percent of decisions within {@code slaTargetDays}
 * @param histogram    bucket counts for the histogram (see {@link #BUCKET_LABELS})
 */
public record PerformanceStats(
        long sampleSize,
        int p50Days,
        int p90Days,
        int meanDays,
        int slaTargetDays,
        int slaOnTimePct,
        List<Long> histogram
) {
    public static final List<String> BUCKET_LABELS = List.of(
            "<14d", "14-30", "30-60", "60-90", "90-120", "120+");
    public static final int[] BUCKET_UPPER_BOUNDS = { 14, 30, 60, 90, 120, Integer.MAX_VALUE };
}
