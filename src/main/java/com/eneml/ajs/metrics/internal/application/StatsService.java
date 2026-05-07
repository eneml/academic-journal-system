package com.eneml.ajs.metrics.internal.application;

import com.eneml.ajs.metrics.api.StatsOverview;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * Read-only journal-wide KPI aggregator used by the admin Statistics page.
 * Reads counts directly from foreign-module tables (submission, publication,
 * editorial_decision, review_assignment) via JdbcTemplate. We deliberately
 * skip cross-module JPA repositories here so this service can stay free of
 * runtime cycles and so the metrics module's allowedDependencies list does
 * not have to declare every editorial table that ever needs counting.
 */
@Service
@RequiredArgsConstructor
public class StatsService {

    private final JdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public StatsOverview overview() {
        OffsetDateTime startOfYear = LocalDate.of(LocalDate.now().getYear(), 1, 1)
                .atStartOfDay(ZoneId.systemDefault())
                .toOffsetDateTime();
        OffsetDateTime ninetyDaysAgo = OffsetDateTime.now().minusDays(90);

        long submissionsYtd = countOrZero(
                "SELECT COUNT(*) FROM submission WHERE date_submitted >= ?",
                startOfYear);
        long articlesYtd = countOrZero(
                "SELECT COUNT(*) FROM publication "
                        + "WHERE status = 'PUBLISHED' AND date_published >= ?",
                startOfYear);
        long accepted = countOrZero(
                "SELECT COUNT(*) FROM editorial_decision WHERE decision_type = 'ACCEPT'");
        long declined = countOrZero(
                "SELECT COUNT(*) FROM editorial_decision "
                        + "WHERE decision_type IN ('DECLINE','INITIAL_DECLINE')");
        long activeReviewers = countOrZero(
                "SELECT COUNT(DISTINCT reviewer_user_id) FROM review_assignment "
                        + "WHERE updated_at >= ?",
                ninetyDaysAgo);

        long total = accepted + declined;
        int pct = total > 0 ? (int) Math.round(100.0 * accepted / total) : 0;

        return new StatsOverview(
                submissionsYtd,
                articlesYtd,
                pct,
                activeReviewers,
                total);
    }

    private long countOrZero(String sql, Object... args) {
        Long n = jdbc.queryForObject(sql, Long.class, args);
        return n == null ? 0L : n;
    }
}
