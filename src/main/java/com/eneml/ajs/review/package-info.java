/**
 * Review module — peer review rounds and reviewer assignments, plus
 * the structured review-form questionnaires sections optionally bind.
 *
 * <p>Owns: ReviewRound, ReviewAssignment, ReviewForm, ReviewFormElement,
 * ReviewFormResponse.
 * <br>Emits: ReviewRoundCreated, ReviewerInvited, ReviewerAccepted,
 * ReviewerDeclined, ReviewSubmitted, ReviewRoundCompleted.
 * <br>Consumes: section bindings via journal::api so the reviewer
 * questionnaire follows the section their assignment belongs to.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Review",
    allowedDependencies = {
        "shared", "identity::api", "submission::api", "storage::api", "journal::api"
    }
)
package com.eneml.ajs.review;
