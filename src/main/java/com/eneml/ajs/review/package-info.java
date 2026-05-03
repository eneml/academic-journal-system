/**
 * Review module — peer review rounds, reviewer assignments, review forms,
 * recommendations.
 *
 * <p>Owns: ReviewRound, ReviewAssignment, ReviewForm, ReviewFormElement,
 * ReviewFormResponse, ReviewFile.
 * <br>Emits: ReviewRoundCreated, ReviewerInvited, ReviewerAccepted,
 * ReviewerDeclined, ReviewSubmitted, ReviewConfirmed, ReviewRoundCompleted.
 * <br>Consumes: SubmissionStageChanged, SubmissionRevised.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Review",
    allowedDependencies = { "shared", "identity::api", "submission::api" }
)
package com.eneml.ajs.review;
