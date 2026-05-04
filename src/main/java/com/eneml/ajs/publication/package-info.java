/**
 * Publication module — versioned, citable rendition of a submission's
 * accepted content. Each Publication snapshot can be edited while in
 * DRAFT, then becomes immutable on publish; corrections are made via
 * a new version that clones the previous one.
 *
 * <p>Owns: Publication.
 * <br>Emits: PublicationDrafted, PublicationVersioned,
 * PublicationPublished, PublicationUnpublished.
 * <br>Consumes: nothing.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Publication",
    allowedDependencies = { "shared", "submission::api", "journal::api", "storage::api" }
)
package com.eneml.ajs.publication;
