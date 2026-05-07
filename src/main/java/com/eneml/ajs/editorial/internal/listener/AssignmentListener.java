package com.eneml.ajs.editorial.internal.listener;

import com.eneml.ajs.editorial.api.DecisionMade;
import com.eneml.ajs.editorial.api.StageRole;
import com.eneml.ajs.editorial.internal.application.StageAssignmentService;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionSummary;
import com.eneml.ajs.submission.api.SubmissionSubmitted;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Keeps {@code stage_assignment} in sync with workflow events without the
 * editor having to add rows manually for the canonical participants:
 *
 * <ul>
 *   <li>The submitter is added as AUTHOR on the SUBMISSION stage when they
 *       hit submit. Subsequent decisions also stamp them onto the destination
 *       stage so the Participants panel always shows them in scope.</li>
 *   <li>Whoever takes a decision is added as EDITOR on the destination stage
 *       (with {@code can_change_metadata=true}) so they keep ownership of the
 *       work as it moves through the funnel.</li>
 * </ul>
 *
 * Both writes are idempotent — the underlying service upserts on the
 * {@code (submission, stage, user, role)} unique tuple.
 */
@Component
@RequiredArgsConstructor
class AssignmentListener {

    private final StageAssignmentService service;
    private final SubmissionLookup submissionLookup;

    @ApplicationModuleListener
    void on(SubmissionSubmitted event) {
        if (event.submittedByUserId() == null) return;
        service.assign(
                event.submissionId(),
                SubmissionStage.SUBMISSION,
                event.submittedByUserId(),
                StageRole.AUTHOR,
                false,
                false,
                null);
    }

    @ApplicationModuleListener
    void on(DecisionMade event) {
        if (event.decidedByUserId() != null) {
            service.assign(
                    event.submissionId(),
                    event.newStage(),
                    event.decidedByUserId(),
                    StageRole.EDITOR,
                    true,
                    false,
                    event.decidedByUserId());
        }
        // Also stamp the AUTHOR onto the destination stage so they show up in
        // the Participants panel on the page they're now redirected to.
        SubmissionSummary submission = submissionLookup.findById(event.submissionId()).orElse(null);
        if (submission != null && submission.submittedByUserId() != null) {
            service.assign(
                    event.submissionId(),
                    event.newStage(),
                    submission.submittedByUserId(),
                    StageRole.AUTHOR,
                    false,
                    false,
                    null);
        }
    }
}
