package com.eneml.ajs.editorial.internal.web.dto;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;

import java.util.List;

/**
 * What the wizard shows before the editor commits — the stage / status
 * the submission will end up in, plus the email steps the system will
 * fire (each pre-rendered with the user-edited subject + body).
 */
public record DecisionPreviewResponse(
        DecisionType type,
        SubmissionStage previousStage,
        SubmissionStage newStage,
        SubmissionStatus newStatus,
        List<DecisionEmailPreview> emailSteps) {
}
