package com.eneml.ajs.editorial.internal.engine;

import com.eneml.ajs.editorial.api.DecisionEmailRequested;
import com.eneml.ajs.editorial.api.DecisionMade;
import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.internal.domain.EditorialDecision;
import com.eneml.ajs.editorial.internal.persistence.EditorialDecisionRepository;
import com.eneml.ajs.review.api.ReviewLookup;
import com.eneml.ajs.review.api.ReviewWorkflow;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStageChanged;
import com.eneml.ajs.submission.api.SubmissionSummary;
import com.eneml.ajs.submission.api.SubmissionWorkflow;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Routes a {@link DecisionType} to its registered {@link DecisionHandler},
 * applies the resulting state mutations through the public submission /
 * review write ports, persists the decision history row, and publishes
 * the corresponding cross-module events.
 */
@Component
public class WorkflowEngine {

    private final Map<DecisionType, DecisionHandler> handlers;
    private final SubmissionLookup submissionLookup;
    private final SubmissionWorkflow submissionWorkflow;
    private final ReviewLookup reviewLookup;
    private final ReviewWorkflow reviewWorkflow;
    private final EditorialDecisionRepository decisionRepository;
    private final ApplicationEventPublisher events;

    public WorkflowEngine(List<DecisionHandler> handlerBeans,
                          SubmissionLookup submissionLookup,
                          SubmissionWorkflow submissionWorkflow,
                          ReviewLookup reviewLookup,
                          ReviewWorkflow reviewWorkflow,
                          EditorialDecisionRepository decisionRepository,
                          ApplicationEventPublisher events) {
        this.handlers = handlerBeans.stream()
                .collect(Collectors.toMap(DecisionHandler::type, Function.identity()));
        this.submissionLookup = submissionLookup;
        this.submissionWorkflow = submissionWorkflow;
        this.reviewLookup = reviewLookup;
        this.reviewWorkflow = reviewWorkflow;
        this.decisionRepository = decisionRepository;
        this.events = events;
    }

    /**
     * Computes the (newStage, newStatus) the engine would land on for the
     * given decision without persisting anything. Used by the wizard preview
     * so the editor can see the destination before committing.
     */
    @Transactional(readOnly = true)
    public PredictedOutcome predict(Long submissionId, DecisionType type, DecisionContext context) {
        DecisionHandler handler = handlers.get(type);
        if (handler == null) {
            throw new IllegalArgumentException("No handler registered for decision " + type);
        }
        SubmissionSummary current = submissionLookup.findById(submissionId)
                .orElseThrow(() -> NotFoundException.of("Submission", submissionId));
        DecisionOutcome outcome = handler.decide(current, context);
        return new PredictedOutcome(current.stage(), outcome.newStage(), outcome.newStatus());
    }

    public record PredictedOutcome(
            SubmissionStage previousStage,
            SubmissionStage newStage,
            com.eneml.ajs.submission.api.SubmissionStatus newStatus) {
    }

    @Transactional
    public EditorialDecision handle(Long submissionId, DecisionType type, DecisionContext context) {
        DecisionHandler handler = handlers.get(type);
        if (handler == null) {
            throw new IllegalArgumentException("No handler registered for decision " + type);
        }

        SubmissionSummary current = submissionLookup.findById(submissionId)
                .orElseThrow(() -> NotFoundException.of("Submission", submissionId));

        DecisionOutcome outcome = handler.decide(current, context);

        boolean stageChanged = outcome.newStage() != current.stage()
                || outcome.newStatus() != current.status();
        if (stageChanged) {
            submissionWorkflow.transitionStage(submissionId, outcome.newStage(), outcome.newStatus());
        }

        switch (outcome.sideEffect()) {
            case OPEN_NEXT_REVIEW_ROUND ->
                    reviewWorkflow.openNextRound(submissionId, SubmissionStage.EXTERNAL_REVIEW);
            case CANCEL_LATEST_REVIEW_ROUND ->
                    reviewLookup.latestRound(submissionId).ifPresent(r ->
                            reviewWorkflow.cancelRound(r.id()));
            case NONE -> { /* no-op */ }
        }

        EditorialDecision row = new EditorialDecision();
        row.setSubmissionId(submissionId);
        row.setReviewRoundId(context.reviewRoundId());
        row.setDecisionType(type);
        row.setPreviousStage(current.stage());
        row.setNewStage(outcome.newStage());
        row.setNewStatus(outcome.newStatus());
        row.setDecidedByUserId(context.actorUserId());
        row.setSummary(context.summary());
        EditorialDecision saved = decisionRepository.save(row);

        boolean wizardOverrides = context.hasEmailOverrides();
        DecisionMade event = wizardOverrides
                ? DecisionMade.withSuppression(saved.getId(), submissionId, type,
                        saved.getPreviousStage(), saved.getNewStage(), saved.getNewStatus(),
                        context.actorUserId())
                : DecisionMade.of(saved.getId(), submissionId, type,
                        saved.getPreviousStage(), saved.getNewStage(), saved.getNewStatus(),
                        context.actorUserId());
        events.publishEvent(event);

        if (wizardOverrides) {
            for (DecisionContext.EmailOverride o : context.emailOverrides()) {
                events.publishEvent(DecisionEmailRequested.of(
                        saved.getId(), submissionId, type,
                        o.recipientUserId(), o.templateKey(),
                        o.subject(), o.body()));
            }
        }

        if (stageChanged) {
            events.publishEvent(SubmissionStageChanged.of(submissionId,
                    saved.getPreviousStage(), saved.getNewStage(), saved.getNewStatus()));
        }
        return saved;
    }
}
