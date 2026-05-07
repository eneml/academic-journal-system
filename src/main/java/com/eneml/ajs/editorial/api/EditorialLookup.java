package com.eneml.ajs.editorial.api;

import com.eneml.ajs.submission.api.SubmissionStage;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface EditorialLookup {

    List<EditorialDecisionSummary> historyOf(Long submissionId);

    /** Participants assigned to {@code submissionId} at {@code stage}. */
    List<StageParticipantSummary> participantsAt(Long submissionId, SubmissionStage stage);

    /** All participants for {@code submissionId} across every stage they appear in. */
    List<StageParticipantSummary> allParticipantsOf(Long submissionId);

    /** Decisions logged on or after {@code since}, broken down by type. Empty buckets omitted. */
    Map<DecisionType, Long> decisionsByType(Instant since);

    /**
     * Decisions per month for {@code year}, restricted to {@code types}. Months
     * with no decisions are omitted.
     */
    Map<Integer, Long> monthlyDecisionCounts(int year, List<DecisionType> types);

    /**
     * Decisions logged on or after {@code since}, broken down by section and
     * decision type. Outer key is sectionId; inner keyed by DecisionType.
     */
    Map<Long, Map<DecisionType, Long>> decisionsBySectionType(Instant since);

    /**
     * Sample of days-from-submission to first ACCEPT / DECLINE / INITIAL_DECLINE
     * decision for submissions decided since {@code since}. Used by the admin
     * Statistics page to compute P50 / P90 / mean / SLA percentages.
     */
    List<Integer> timeToDecisionDaysSample(Instant since);
}
