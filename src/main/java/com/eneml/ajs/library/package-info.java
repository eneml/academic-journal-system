/**
 * Library module — per-user saved articles ("reading list"). Surfaced on the
 * public reading page via the Save button, and listed on the user's profile.
 *
 * <p>Owns: UserLibraryItem.
 * <br>Consumes: identity::api (current user), publication::api (article ref).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Library",
    allowedDependencies = { "shared", "identity::api", "publication::api" }
)
package com.eneml.ajs.library;
