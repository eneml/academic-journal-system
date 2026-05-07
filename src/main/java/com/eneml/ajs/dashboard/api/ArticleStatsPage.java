package com.eneml.ajs.dashboard.api;

import java.util.List;

/**
 * Paged result for the admin Statistics → Articles table.
 *
 * @param rows         page of rows, sorted by total views descending
 * @param totalRows    how many distinct publications had any activity in
 *                     the inspected range (after the search filter)
 * @param page         zero-based page index returned
 * @param size         page size requested
 */
public record ArticleStatsPage(
        List<ArticleStatsRow> rows,
        long totalRows,
        int page,
        int size
) {
}
