package com.eneml.ajs.dashboard.internal.application;

import com.eneml.ajs.dashboard.api.DecisionBreakdown;
import com.eneml.ajs.dashboard.api.MonthlyFlowPoint;
import com.eneml.ajs.dashboard.api.StatsOverview;
import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.api.EditorialLookup;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.review.api.ReviewLookup;
import com.eneml.ajs.submission.api.SubmissionLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Composes the admin Statistics page entirely from public Lookup APIs of
 * the submission, editorial, review, and publication modules. No direct
 * cross-module table reads — every count comes through a contract surface
 * that those modules opted into.
 */
@Service
@RequiredArgsConstructor
public class StatsService {

    private static final List<DecisionType> DECISION_FLOW_TYPES = List.of(
            DecisionType.ACCEPT,
            DecisionType.DECLINE,
            DecisionType.INITIAL_DECLINE,
            DecisionType.REQUEST_REVISIONS);

    private final SubmissionLookup submissions;
    private final EditorialLookup editorial;
    private final ReviewLookup reviews;
    private final PublicationLookup publications;

    @Transactional(readOnly = true)
    public StatsOverview overview() {
        OffsetDateTime startOfYear = LocalDate.of(LocalDate.now().getYear(), 1, 1)
                .atStartOfDay(ZoneId.systemDefault())
                .toOffsetDateTime();
        OffsetDateTime ninetyDaysAgo = OffsetDateTime.now().minusDays(90);

        long submissionsYtd = submissions.countSubmittedSince(startOfYear.toInstant());
        long articlesYtd = publications.countPublishedSince(startOfYear.toInstant());
        long activeReviewers = reviews.countActiveReviewersSince(ninetyDaysAgo.toInstant());

        Map<DecisionType, Long> byType = editorial.decisionsByType(java.time.Instant.EPOCH);
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
        Map<DecisionType, Long> byType = editorial.decisionsByType(java.time.Instant.EPOCH);
        return byType.entrySet().stream()
                .map(e -> new DecisionBreakdown(e.getKey(), e.getValue()))
                .sorted((a, b) -> Long.compare(b.count(), a.count()))
                .toList();
    }
}
