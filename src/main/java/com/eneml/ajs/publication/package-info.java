/**
 * Publication module — versioned, citable rendition of a submission's
 * accepted content. Each Publication snapshot can be edited while in
 * DRAFT, then becomes immutable on publish; corrections are made via
 * a new version that clones the previous one. Galleys are the public
 * renditions (PDF/HTML/JATS) attached to a publication, and DOIs are
 * registered identifiers assignable to either a publication or a
 * specific galley.
 *
 * <p>Owns: Publication, Galley, Doi.
 * <br>Emits: PublicationDrafted, PublicationVersioned,
 * PublicationPublished, PublicationUnpublished, GalleyAdded,
 * GalleyApproved, DoiAssigned.
 * <br>Consumes: nothing.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Publication",
    allowedDependencies = { "shared", "submission::api", "journal::api", "storage::api" }
)
package com.eneml.ajs.publication;
