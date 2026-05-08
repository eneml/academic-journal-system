/**
 * Highlight module — curated featured cards on the homepage. Each row
 * is an editor pick: a tile with title, description, optional cover
 * image, and a link target (either an internal publication or an
 * external URL). Sorting is manual (sort_order ASC).
 *
 * <p>Owns: Highlight.
 * <br>Emits: nothing.
 * <br>Consumes: storage::api (presigned URLs for cover image),
 * publication::api (resolves target publication URL on serve).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Highlight",
    allowedDependencies = { "shared", "storage::api", "publication::api" }
)
package com.eneml.ajs.highlight;
