package com.eneml.ajs.editorial.internal.application;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.internal.domain.EditorialDecision;
import com.eneml.ajs.editorial.internal.engine.DecisionContext;
import com.eneml.ajs.editorial.internal.engine.WorkflowEngine;
import com.eneml.ajs.editorial.internal.persistence.EditorialDecisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EditorialDecisionService {

    private final WorkflowEngine engine;
    private final EditorialDecisionRepository repository;

    public List<EditorialDecision> historyOf(Long submissionId) {
        return repository.findBySubmissionIdOrderByDateDecided(submissionId);
    }

    @Transactional
    public EditorialDecision take(Long submissionId, DecisionType type, DecisionContext context) {
        return engine.handle(submissionId, type, context);
    }
}
