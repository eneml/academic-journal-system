/**
 * Review module — peer review rounds and reviewer assignments.
 *
 * <p>Owns: ReviewRound, ReviewAssignment.
 * <br>Emits: ReviewRoundCreated, ReviewerInvited, ReviewerAccepted,
 * ReviewerDeclined, ReviewSubmitted, ReviewRoundCompleted.
 * <br>Consumes: nothing.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Review",
    allowedDependencies = { "shared", "identity::api", "submission::api" }
)
package com.eneml.ajs.review;
