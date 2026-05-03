package com.eneml.ajs.editorial.internal.application;

import com.eneml.ajs.editorial.api.EditorialDecisionSummary;
import com.eneml.ajs.editorial.api.EditorialLookup;
import com.eneml.ajs.editorial.internal.persistence.EditorialDecisionRepository;
import com.eneml.ajs.editorial.internal.web.mapper.EditorialDecisionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
}
