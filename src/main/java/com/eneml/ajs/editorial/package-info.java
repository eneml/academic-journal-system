/**
 * Editorial module — editorial decision engine, recommendations (sub-editor),
 * stage transitions, editorial discussions (queries).
 *
 * <p>Owns: EditorialDecision, Recommendation, Query, QueryParticipant, Note.
 * <br>Emits: DecisionMade, RecommendationMade, SubmissionAccepted,
 * SubmissionDeclined, RevisionsRequested, ResubmissionRequested,
 * SentToProduction, SentToCopyediting.
 * <br>Consumes: ReviewRoundCompleted, SubmissionSubmitted.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Editorial",
    allowedDependencies = { "shared", "identity::api", "submission::api", "review::api" }
)
package com.eneml.ajs.editorial;
