/**
 * Submission module — manuscript submissions, draft progress, contributors,
 * uploaded files (lifecycle-typed by file_stage), stage assignments.
 *
 * <p>Owns: Submission, SubmissionFile, Author, AuthorAffiliation,
 * StageAssignment, Citation, ReviewerSuggestion.
 * <br>Emits: SubmissionStarted, SubmissionSubmitted, SubmissionRevised,
 * SubmissionFileUploaded, StageAssigned, SubmissionStageChanged.
 * <br>Consumes: UserRegistered, UserGroupAssigned (auto-add author
 * to user_user_groups when first submission is created).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Submission",
    allowedDependencies = { "shared", "identity::api", "journal::api", "storage::api" }
)
package com.eneml.ajs.submission;
