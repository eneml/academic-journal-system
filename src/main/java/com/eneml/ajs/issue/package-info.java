/**
 * Issue module — journal issues that group publications.
 *
 * <p>Owns: Issue.
 * <br>Emits: IssueCreated, IssuePublished, IssueUnpublished.
 * <br>Consumes: nothing.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Issue",
    allowedDependencies = { "shared", "publication::api", "journal::api" }
)
package com.eneml.ajs.issue;
