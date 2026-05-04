/**
 * Issue module — journal issues that group publications.
 *
 * <p>Owns: Issue.
 * <br>Emits: IssueCreated, IssuePublished, IssueUnpublished.
 * <br>Consumes: storage::api (combined-issue PDF builder reads galley
 * file bytes server-side and merges them with PDFBox).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Issue",
    allowedDependencies = { "shared", "publication::api", "journal::api", "storage::api" }
)
package com.eneml.ajs.issue;
