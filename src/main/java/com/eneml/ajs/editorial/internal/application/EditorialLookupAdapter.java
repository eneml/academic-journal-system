package com.eneml.ajs.editorial.internal.application;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.api.EditorialDecisionSummary;
import com.eneml.ajs.editorial.api.EditorialLookup;
import com.eneml.ajs.editorial.internal.persistence.EditorialDecisionRepository;
import com.eneml.ajs.editorial.internal.web.mapper.EditorialDecisionMapper;
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

    @Override
    public List<EditorialDecisionSummary> historyOf(Long submissionId) {
        return mapper.toSummaries(repository.findBySubmissionIdOrderByDateDecided(submissionId));
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
}
