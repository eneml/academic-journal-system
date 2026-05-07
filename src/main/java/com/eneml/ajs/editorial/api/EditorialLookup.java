package com.eneml.ajs.editorial.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface EditorialLookup {

    List<EditorialDecisionSummary> historyOf(Long submissionId);

    /** Decisions logged on or after {@code since}, broken down by type. Empty buckets omitted. */
    Map<DecisionType, Long> decisionsByType(Instant since);

    /**
     * Decisions per month for {@code year}, restricted to {@code types}. Months
     * with no decisions are omitted.
     */
    Map<Integer, Long> monthlyDecisionCounts(int year, List<DecisionType> types);
}
