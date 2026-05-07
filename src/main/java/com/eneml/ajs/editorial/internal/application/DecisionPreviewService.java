package com.eneml.ajs.editorial.internal.application;

import com.eneml.ajs.editorial.api.DecisionEmailPlan;
import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.internal.engine.DecisionContext;
import com.eneml.ajs.editorial.internal.engine.WorkflowEngine;
import com.eneml.ajs.editorial.internal.web.dto.DecisionEmailPreview;
import com.eneml.ajs.editorial.internal.web.dto.DecisionEmailRecipient;
import com.eneml.ajs.editorial.internal.web.dto.DecisionPreviewResponse;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds the wizard's pre-commit preview: the predicted stage transition
 * plus the email steps the editor can edit. Rendering of the actual
 * subject/body lives in messaging — the preview here returns just the
 * {@code templateKey} per step so the frontend can call the messaging
 * render endpoint with the appropriate variables.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DecisionPreviewService {

    private final WorkflowEngine engine;
    private final SubmissionLookup submissionLookup;
    private final UserDirectoryService userDirectory;

    public DecisionPreviewResponse preview(Long submissionId,
                                            DecisionType type,
                                            Long actorUserId,
                                            Long reviewRoundId) {
        DecisionContext ctx = new DecisionContext(actorUserId, reviewRoundId, null, List.of());
        WorkflowEngine.PredictedOutcome outcome = engine.predict(submissionId, type, ctx);

        SubmissionSummary submission = submissionLookup.findById(submissionId)
                .orElseThrow(() -> NotFoundException.of("Submission", submissionId));

        List<DecisionEmailPreview> steps = new ArrayList<>();
        DecisionEmailPlan.authorKeyFor(type).ifPresent(authorKey ->
                buildAuthorStep(submission, type, authorKey).ifPresent(steps::add));

        return new DecisionPreviewResponse(
                type,
                outcome.previousStage(),
                outcome.newStage(),
                outcome.newStatus(),
                steps);
    }

    private java.util.Optional<DecisionEmailPreview> buildAuthorStep(
            SubmissionSummary submission, DecisionType type, String templateKey) {
        if (submission.submittedByUserId() == null) {
            return java.util.Optional.empty();
        }
        UserSummary author = userDirectory.findById(submission.submittedByUserId()).orElse(null);
        if (author == null) {
            return java.util.Optional.empty();
        }
        DecisionEmailRecipient recipient = new DecisionEmailRecipient(
                author.id(),
                author.email(),
                author.fullName(),
                author.locale(),
                "AUTHOR");
        return java.util.Optional.of(new DecisionEmailPreview(
                "author",
                "Notify the author",
                templateKey,
                author.locale(),
                false, // templateConfigured — frontend determines this from /email-templates/{key}/render response
                false, // canSkip
                List.of(recipient),
                "",    // pre-rendered subject — frontend fetches via render endpoint
                ""));  // pre-rendered body
    }
}
