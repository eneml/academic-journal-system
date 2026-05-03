/**
 * Submission module — manuscript submissions, contributors, uploaded
 * files lifecycle-typed by stage. Owns the durable shell that survives
 * the entire editorial workflow.
 *
 * <p>Owns: Submission, SubmissionAuthor, SubmissionFile.
 * <br>Emits: SubmissionStarted, SubmissionSubmitted, SubmissionStageChanged,
 * SubmissionFileUploaded.
 * <br>Consumes: nothing.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Submission",
    allowedDependencies = { "shared", "identity::api", "journal::api", "storage::api" }
)
package com.eneml.ajs.submission;
