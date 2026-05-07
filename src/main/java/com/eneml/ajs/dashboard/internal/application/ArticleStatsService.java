package com.eneml.ajs.dashboard.internal.application;

import com.eneml.ajs.dashboard.api.ArticleStatsPage;
import com.eneml.ajs.dashboard.api.ArticleStatsRow;
import com.eneml.ajs.metrics.api.DailyMetricsBucket;
import com.eneml.ajs.metrics.api.MetricsLookup;
import com.eneml.ajs.metrics.api.PublicationMetricsRange;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.submission.api.SubmissionAuthorSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Articles statistics surface for the admin page. Composes the metrics
 * module's per-publication totals with the publication's title and a
 * short author byline so the frontend table can show one self-contained
 * row per article.
 */
@Service
@RequiredArgsConstructor
public class ArticleStatsService {

    private final MetricsLookup metrics;
    private final PublicationLookup publications;
    private final SubmissionLookup submissions;

    @Transactional(readOnly = true)
    public List<DailyMetricsBucket> timeseries(LocalDate from, LocalDate to, boolean monthly) {
        return metrics.timeseries(from, to, monthly);
    }

    @Transactional(readOnly = true)
    public ArticleStatsPage articles(
            LocalDate from,
            LocalDate to,
            String search,
            String locale,
            int page,
            int size,
            String sort,
            String dir) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 200));
        String needle = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);

        List<PublicationMetricsRange> totals = metrics.articleTotalsForRange(from, to);

        Comparator<ArticleStatsRow> comparator = comparatorFor(sort);
        boolean descending = dir == null || !"asc".equalsIgnoreCase(dir);
        if (descending) comparator = comparator.reversed();

        List<ArticleStatsRow> all = totals.stream()
                .map(t -> enrich(t, locale))
                .filter(row -> matches(row, needle))
                .sorted(comparator)
                .toList();

        int totalRows = all.size();
        int fromIdx = Math.min(safePage * safeSize, totalRows);
        int toIdx = Math.min(fromIdx + safeSize, totalRows);
        return new ArticleStatsPage(all.subList(fromIdx, toIdx), totalRows, safePage, safeSize);
    }

    private static Comparator<ArticleStatsRow> comparatorFor(String sort) {
        if (sort == null) return Comparator.comparingLong(ArticleStatsRow::total);
        return switch (sort.toLowerCase(Locale.ROOT)) {
            case "abstract", "abstractviews" ->
                    Comparator.comparingLong(ArticleStatsRow::abstractViews);
            case "file", "fileviews" ->
                    Comparator.comparingLong(ArticleStatsRow::fileViews);
            case "pdf", "pdfviews" ->
                    Comparator.comparingLong(ArticleStatsRow::pdfViews);
            case "html", "htmlviews" ->
                    Comparator.comparingLong(ArticleStatsRow::htmlViews);
            case "other", "otherviews" ->
                    Comparator.comparingLong(ArticleStatsRow::otherViews);
            case "title" -> Comparator.comparing(
                    ArticleStatsRow::title,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            default -> Comparator.comparingLong(ArticleStatsRow::total);
        };
    }

    private ArticleStatsRow enrich(PublicationMetricsRange totals, String locale) {
        Optional<PublicationSummary> pub = publications.findById(totals.publicationId());
        String title = pub.map(p -> pickLocalized(p.title(), locale))
                .orElse("Publication #" + totals.publicationId());
        String byline = pub
                .map(p -> formatByline(submissions.authorsOf(p.submissionId())))
                .orElse(null);
        return new ArticleStatsRow(
                totals.publicationId(),
                title,
                byline,
                totals.abstractViews(),
                totals.fileViews(),
                totals.pdfViews(),
                totals.htmlViews(),
                totals.otherViews(),
                totals.total());
    }

    private static String pickLocalized(Map<String, String> map, String locale) {
        if (map == null || map.isEmpty()) return "";
        String exact = map.get(locale);
        if (exact != null && !exact.isBlank()) return exact;
        return map.values().stream()
                .filter(v -> v != null && !v.isBlank())
                .findFirst()
                .orElse("");
    }

    private static String formatByline(List<SubmissionAuthorSummary> authors) {
        if (authors == null || authors.isEmpty()) return null;
        String firstFamily = familyName(authors.get(0));
        if (firstFamily == null || firstFamily.isBlank()) return null;
        if (authors.size() == 1) return firstFamily;
        if (authors.size() == 2) {
            String secondFamily = familyName(authors.get(1));
            if (secondFamily == null || secondFamily.isBlank()) return firstFamily;
            return firstFamily + " & " + secondFamily;
        }
        return firstFamily + " et al.";
    }

    private static String familyName(SubmissionAuthorSummary a) {
        return a.familyName() != null && !a.familyName().isBlank()
                ? a.familyName()
                : a.givenName();
    }

    private static boolean matches(ArticleStatsRow row, String needle) {
        if (needle.isEmpty()) return true;
        if (row.title() != null
                && row.title().toLowerCase(Locale.ROOT).contains(needle)) {
            return true;
        }
        if (row.authorByline() != null
                && row.authorByline().toLowerCase(Locale.ROOT).contains(needle)) {
            return true;
        }
        return Long.toString(row.publicationId()).contains(needle);
    }
}
