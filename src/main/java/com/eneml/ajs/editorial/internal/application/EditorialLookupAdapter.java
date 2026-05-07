package com.eneml.ajs.editorial.internal.application;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.api.EditorialDecisionSummary;
import com.eneml.ajs.editorial.api.EditorialLookup;
import com.eneml.ajs.editorial.api.StageParticipantSummary;
import com.eneml.ajs.editorial.internal.persistence.EditorialDecisionRepository;
import com.eneml.ajs.editorial.internal.web.mapper.EditorialDecisionMapper;
import com.eneml.ajs.submission.api.SubmissionStage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class EditorialLookupAdapter implements EditorialLookup {

    private final EditorialDecisionRepository repository;
    private final EditorialDecisionMapper mapper;
    private final StageAssignmentService stageAssignments;

    @Override
    public List<EditorialDecisionSummary> historyOf(Long submissionId) {
        return mapper.toSummaries(repository.findBySubmissionIdOrderByDateDecided(submissionId));
    }

    @Override
    public List<StageParticipantSummary> participantsAt(Long submissionId, SubmissionStage stage) {
        return stageAssignments.participantsAt(submissionId, stage);
    }

    @Override
    public List<StageParticipantSummary> allParticipantsOf(Long submissionId) {
        return stageAssignments.allParticipants(submissionId);
    }

    @Override
    public Map<DecisionType, Long> decisionsByType(Instant since) {
        Map<DecisionType, Long> out = new EnumMap<>(DecisionType.class);
        for (Object[] row : repository.decisionsByType(since)) {
            try {
                DecisionType t = DecisionType.valueOf((String) row[0]);
                out.put(t, ((Number) row[1]).longValue());
            } catch (IllegalArgumentException ignored) {
                // Skip rows whose decision_type isn't a current enum constant.
            }
        }
        return out;
    }

    @Override
    public Map<Integer, Long> monthlyDecisionCounts(int year, List<DecisionType> types) {
        if (types == null || types.isEmpty()) return Map.of();
        List<String> typeNames = types.stream().map(Enum::name).toList();
        Map<Integer, Long> out = new LinkedHashMap<>();
        for (Object[] row : repository.monthlyDecisionCounts(year, typeNames)) {
            out.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }
        return out;
    }

    @Override
    public Map<Long, Map<DecisionType, Long>> decisionsBySectionType(Instant since) {
        Map<Long, Map<DecisionType, Long>> out = new LinkedHashMap<>();
        for (Object[] row : repository.decisionsBySectionType(since)) {
            Long sectionId = ((Number) row[0]).longValue();
            DecisionType type;
            try {
                type = DecisionType.valueOf((String) row[1]);
            } catch (IllegalArgumentException ignored) {
                continue;
            }
            long count = ((Number) row[2]).longValue();
            out.computeIfAbsent(sectionId, k -> new EnumMap<>(DecisionType.class))
                    .put(type, count);
        }
        return out;
    }

    @Override
    public List<Integer> timeToDecisionDaysSample(Instant since) {
        return repository.timeToDecisionDaysSample(since).stream()
                .map(d -> (int) Math.round(d))
                .toList();
    }
}
