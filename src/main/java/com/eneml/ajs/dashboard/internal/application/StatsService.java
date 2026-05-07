package com.eneml.ajs.dashboard.internal.application;

import com.eneml.ajs.dashboard.api.DecisionBreakdown;
import com.eneml.ajs.dashboard.api.IssueStatsRow;
import com.eneml.ajs.dashboard.api.MonthlyFlowPoint;
import com.eneml.ajs.dashboard.api.PerformanceStats;
import com.eneml.ajs.dashboard.api.ReadingImpactSummary;
import com.eneml.ajs.dashboard.api.SectionStatsRow;
import com.eneml.ajs.dashboard.api.StatsOverview;
import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.api.EditorialLookup;
import com.eneml.ajs.issue.api.IssueLookup;
import com.eneml.ajs.issue.api.IssueSummary;
import com.eneml.ajs.journal.api.SectionLookup;
import com.eneml.ajs.journal.api.SectionSummary;
import com.eneml.ajs.metrics.api.MetricsLookup;
import com.eneml.ajs.metrics.api.PublicationMetricsRange;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.review.api.ReviewLookup;
import com.eneml.ajs.submission.api.SubmissionLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Composes the admin Statistics page entirely from public Lookup APIs of
 * the submission, editorial, review, publication, journal, issue, and
 * metrics modules. No direct cross-module table reads — every count comes
 * through a contract surface that those modules opted into.
 */
@Service
@RequiredArgsConstructor
public class StatsService {

    private static final List<DecisionType> DECISION_FLOW_TYPES = List.of(
            DecisionType.ACCEPT,
            DecisionType.DECLINE,
            DecisionType.INITIAL_DECLINE,
            DecisionType.REQUEST_REVISIONS);

    private static final int SLA_TARGET_DAYS = 90;

    private final SubmissionLookup submissions;
    private final EditorialLookup editorial;
    private final ReviewLookup reviews;
    private final PublicationLookup publications;
    private final SectionLookup sections;
    private final IssueLookup issues;
    private final MetricsLookup metrics;

    @Transactional(readOnly = true)
    public StatsOverview overview() {
        OffsetDateTime startOfYear = LocalDate.of(LocalDate.now().getYear(), 1, 1)
                .atStartOfDay(ZoneId.systemDefault())
                .toOffsetDateTime();
        OffsetDateTime ninetyDaysAgo = OffsetDateTime.now().minusDays(90);

        long submissionsYtd = submissions.countSubmittedSince(startOfYear.toInstant());
        long articlesYtd = publications.countPublishedSince(startOfYear.toInstant());
        long activeReviewers = reviews.countActiveReviewersSince(ninetyDaysAgo.toInstant());

        Map<DecisionType, Long> byType = editorial.decisionsByType(Instant.EPOCH);
        long accepted = byType.getOrDefault(DecisionType.ACCEPT, 0L);
        long declined = byType.getOrDefault(DecisionType.DECLINE, 0L)
                + byType.getOrDefault(DecisionType.INITIAL_DECLINE, 0L);
        long total = accepted + declined;
        int pct = total > 0 ? (int) Math.round(100.0 * accepted / total) : 0;

        return new StatsOverview(
                submissionsYtd,
                articlesYtd,
                pct,
                activeReviewers,
                total);
    }

    @Transactional(readOnly = true)
    public List<MonthlyFlowPoint> monthlyFlow(int year) {
        Map<Integer, Long> monthlySubs = submissions.monthlySubmissionCounts(year);
        Map<Integer, Long> monthlyDecs = editorial.monthlyDecisionCounts(year, DECISION_FLOW_TYPES);
        List<MonthlyFlowPoint> out = new ArrayList<>(12);
        for (int m = 1; m <= 12; m++) {
            out.add(new MonthlyFlowPoint(
                    m,
                    monthlySubs.getOrDefault(m, 0L),
                    monthlyDecs.getOrDefault(m, 0L)));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<DecisionBreakdown> decisionBreakdown() {
        Map<DecisionType, Long> byType = editorial.decisionsByType(Instant.EPOCH);
        return byType.entrySet().stream()
                .map(e -> new DecisionBreakdown(e.getKey(), e.getValue()))
                .sorted((a, b) -> Long.compare(b.count(), a.count()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SectionStatsRow> sectionStats(String locale) {
        Instant startOfYear = LocalDate.of(LocalDate.now().getYear(), 1, 1)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant();
        Map<Long, Long> subBySection = submissions.countBySectionSince(startOfYear);
        Map<Long, Map<DecisionType, Long>> decBySection =
                editorial.decisionsBySectionType(startOfYear);
        List<SectionSummary> all = sections.listActive();
        List<SectionStatsRow> out = new ArrayList<>(all.size());
        for (SectionSummary s : all) {
            long submitted = subBySection.getOrDefault(s.id(), 0L);
            Map<DecisionType, Long> decs = decBySection.getOrDefault(s.id(), Map.of());
            long accepted = decs.getOrDefault(DecisionType.ACCEPT, 0L);
            long declined = decs.getOrDefault(DecisionType.DECLINE, 0L)
                    + decs.getOrDefault(DecisionType.INITIAL_DECLINE, 0L);
            long closed = accepted + declined;
            int pct = closed > 0 ? (int) Math.round(100.0 * accepted / closed) : 0;
            out.add(new SectionStatsRow(
                    s.id(),
                    s.code(),
                    pickLocalized(s.title(), locale),
                    submitted,
                    accepted,
                    declined,
                    pct));
        }
        out.sort((a, b) -> Long.compare(b.submissions(), a.submissions()));
        return out;
    }

    @Transactional(readOnly = true)
    public PerformanceStats performance() {
        Instant startOfYear = LocalDate.of(LocalDate.now().getYear(), 1, 1)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant();
        List<Integer> sample = editorial.timeToDecisionDaysSample(startOfYear);
        if (sample.isEmpty()) {
            return new PerformanceStats(
                    0, 0, 0, 0, SLA_TARGET_DAYS, 0,
                    List.of(0L, 0L, 0L, 0L, 0L, 0L));
        }
        List<Integer> sorted = new ArrayList<>(sample);
        sorted.sort(Comparator.naturalOrder());
        int n = sorted.size();
        int p50 = sorted.get(Math.min(n - 1, (int) Math.floor(0.50 * n)));
        int p90 = sorted.get(Math.min(n - 1, (int) Math.floor(0.90 * n)));
        long sum = 0;
        long onTime = 0;
        long[] hist = new long[PerformanceStats.BUCKET_UPPER_BOUNDS.length];
        for (int d : sorted) {
            sum += d;
            if (d <= SLA_TARGET_DAYS) onTime++;
            for (int i = 0; i < PerformanceStats.BUCKET_UPPER_BOUNDS.length; i++) {
                if (d < PerformanceStats.BUCKET_UPPER_BOUNDS[i]) {
                    hist[i]++;
                    break;
                }
            }
        }
        int mean = (int) Math.round((double) sum / n);
        int onTimePct = (int) Math.round(100.0 * onTime / n);
        List<Long> histogram = new ArrayList<>(hist.length);
        for (long h : hist) histogram.add(h);
        return new PerformanceStats(
                n, p50, p90, mean, SLA_TARGET_DAYS, onTimePct, histogram);
    }

    @Transactional(readOnly = true)
    public ReadingImpactSummary readingImpact() {
        // Sum across all metric_daily rows ever recorded — bounded by
        // EPOCH..today. Cheap because the daily table has one row per
        // (publication, day) and we already have an aggregation index.
        List<PublicationMetricsRange> all = metrics.articleTotalsForRange(
                LocalDate.of(2000, 1, 1), LocalDate.now().plusDays(1));
        long abstracts = 0;
        long files = 0;
        for (PublicationMetricsRange r : all) {
            abstracts += r.abstractViews();
            files += r.fileViews();
        }
        // Citations and impact factor are placeholders — Crossref-cited-by
        // and the IF computation land with the next integration iteration.
        return new ReadingImpactSummary(abstracts, files, 0L, null);
    }

    @Transactional(readOnly = true)
    public List<IssueStatsRow> issueStats(int limit) {
        int safe = Math.max(1, Math.min(limit, 50));
        List<IssueSummary> all = issues.listPublished(safe);
        List<IssueStatsRow> out = new ArrayList<>(all.size());
        for (IssueSummary i : all) {
            List<PublicationSummary> pubs = publications.publishedInIssue(i.id());
            long abstracts = 0;
            long files = 0;
            for (PublicationSummary p : pubs) {
                var m = metrics.getMetrics(p.id());
                abstracts += m.viewCount();
                files += m.downloadCount();
            }
            out.add(new IssueStatsRow(
                    i.id(),
                    i.identification(),
                    i.datePublished() == null ? null : i.datePublished().toString(),
                    pubs.size(),
                    abstracts,
                    files,
                    abstracts + files));
        }
        return out;
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

    /** Small helper for tests. */
    Optional<Integer> percentile(List<Integer> sorted, double p) {
        if (sorted.isEmpty()) return Optional.empty();
        int idx = Math.min(sorted.size() - 1, (int) Math.floor(p * sorted.size()));
        return Optional.of(sorted.get(idx));
    }
}
