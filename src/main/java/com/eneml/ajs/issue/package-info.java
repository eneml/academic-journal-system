/**
 * Issue module — journal issues, table-of-contents ordering, issue galleys.
 *
 * <p>Owns: Issue, IssueGalley, CustomIssueOrder, CustomSectionOrder.
 * <br>Emits: IssueCreated, IssuePublished, IssueUnpublished,
 * PublicationScheduled.
 * <br>Consumes: PublicationPublished (to refresh TOC projections).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Issue",
    allowedDependencies = { "shared", "publication::api", "journal::api" }
)
package com.eneml.ajs.issue;
