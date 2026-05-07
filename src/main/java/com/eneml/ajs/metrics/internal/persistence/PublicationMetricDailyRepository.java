package com.eneml.ajs.metrics.internal.persistence;

import com.eneml.ajs.metrics.internal.domain.PublicationMetricDaily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PublicationMetricDailyRepository
        extends JpaRepository<PublicationMetricDaily, Long> {

    /**
     * Atomic upsert that bumps a per-day counter. Postgres' ON CONFLICT
     * keeps two concurrent first-bumps from creating duplicate rows.
     * The {@code column} parameter is hard-coded by the caller — never
     * pass user input to it.
     */
    @Modifying
    @Query(value = """
            INSERT INTO publication_metric_daily
                (publication_id, day, abstract_views, pdf_views, html_views, other_views,
                 created_at, updated_at)
            VALUES (:publicationId, :day,
                    CASE WHEN :column = 'abstract' THEN 1 ELSE 0 END,
                    CASE WHEN :column = 'pdf'      THEN 1 ELSE 0 END,
                    CASE WHEN :column = 'html'     THEN 1 ELSE 0 END,
                    CASE WHEN :column = 'other'    THEN 1 ELSE 0 END,
                    NOW(), NOW())
            ON CONFLICT (publication_id, day) DO UPDATE SET
                abstract_views = publication_metric_daily.abstract_views
                                  + CASE WHEN :column = 'abstract' THEN 1 ELSE 0 END,
                pdf_views      = publication_metric_daily.pdf_views
                                  + CASE WHEN :column = 'pdf'      THEN 1 ELSE 0 END,
                html_views     = publication_metric_daily.html_views
                                  + CASE WHEN :column = 'html'     THEN 1 ELSE 0 END,
                other_views    = publication_metric_daily.other_views
                                  + CASE WHEN :column = 'other'    THEN 1 ELSE 0 END,
                updated_at     = NOW()
            """,
            nativeQuery = true)
    int bump(
            @Param("publicationId") long publicationId,
            @Param("day") LocalDate day,
            @Param("column") String column);

    /**
     * Daily totals across all publications for a date range. Returns rows
     * shaped (day, abstracts, files) where {@code files = pdf + html + other}.
     */
    @Query(value = """
            SELECT day::text AS d,
                   SUM(abstract_views) AS abstracts,
                   SUM(pdf_views) + SUM(html_views) + SUM(other_views) AS files
            FROM publication_metric_daily
            WHERE day BETWEEN :from AND :to
            GROUP BY day
            ORDER BY day
            """,
            nativeQuery = true)
    List<Object[]> dailyTotals(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query(value = """
            SELECT to_char(date_trunc('month', day), 'YYYY-MM') AS m,
                   SUM(abstract_views) AS abstracts,
                   SUM(pdf_views) + SUM(html_views) + SUM(other_views) AS files
            FROM publication_metric_daily
            WHERE day BETWEEN :from AND :to
            GROUP BY 1
            ORDER BY 1
            """,
            nativeQuery = true)
    List<Object[]> monthlyTotals(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * Per-publication aggregated counters for the date range. Returns rows
     * shaped (publication_id, abstracts, pdf, html, other), restricted to
     * publications that had at least one event in the window.
     */
    @Query(value = """
            SELECT publication_id,
                   SUM(abstract_views) AS abstracts,
                   SUM(pdf_views) AS pdf,
                   SUM(html_views) AS html,
                   SUM(other_views) AS other
            FROM publication_metric_daily
            WHERE day BETWEEN :from AND :to
            GROUP BY publication_id
            """,
            nativeQuery = true)
    List<Object[]> articleTotalsForRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * Per-publication daily series for one article. Powers the homepage
     * sparkline + the per-article stats chart. Returns rows shaped
     * (day, abstracts, files), one per day in [from..to] that has data.
     */
    @Query(value = """
            SELECT day::text AS d,
                   abstract_views                                 AS abstracts,
                   pdf_views + html_views + other_views          AS files
            FROM publication_metric_daily
            WHERE publication_id = :publicationId
              AND day BETWEEN :from AND :to
            ORDER BY day
            """,
            nativeQuery = true)
    List<Object[]> publicationDaily(
            @Param("publicationId") long publicationId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
