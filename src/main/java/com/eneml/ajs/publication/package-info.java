/**
 * Publication module — versioned publications, galleys, JATS XML, DOIs,
 * copyright/license info.
 *
 * <p>Owns: Publication, Galley, Doi, JatsFile, Copyright.
 * <br>Emits: PublicationDrafted, PublicationVersioned, PublicationPublished,
 * PublicationUnpublished, GalleyApproved, DoiAssigned.
 * <br>Consumes: SubmissionAccepted, SentToProduction.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Publication",
    allowedDependencies = { "shared", "submission::api", "journal::api", "storage::api" }
)
package com.eneml.ajs.publication;
