/**
 * Category module — hierarchical, multilingual taxonomy. Publications
 * opt into one or more categories; the public site exposes browsable
 * pages per category and editorial admins curate the tree.
 *
 * <p>Owns: Category, PublicationCategory.
 * <br>Emits: CategoryCreated, CategoryUpdated, CategoryRemoved (planned).
 * <br>Consumes: storage::api (cover image), publication::api (only
 * read — to count publications per category).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Category",
    allowedDependencies = { "shared", "storage::api", "publication::api" }
)
package com.eneml.ajs.category;
