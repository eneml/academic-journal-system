/**
 * Storage module — S3-compatible binary store. Tracks every uploaded
 * file (manuscripts, supplementary, galleys, JATS XML) with content
 * hashing, deduplication, and presigned download URLs.
 *
 * <p>Owns: StoredFile.
 * <br>Emits: FileStored, FileDeleted.
 * <br>Consumes: nothing (other modules call the service directly).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Storage",
    allowedDependencies = { "shared" }
)
package com.eneml.ajs.storage;
