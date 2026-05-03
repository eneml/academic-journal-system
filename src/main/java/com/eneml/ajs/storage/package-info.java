/**
 * Storage module — physical file store abstraction (S3-compatible),
 * temporary upload buffer, virus scan hooks, content hashing.
 *
 * <p>Owns: StoredFile, TemporaryFile.
 * <br>Emits: FileStored, FileDeleted.
 * <br>Consumes: SubmissionFileUploaded.
 *
 * <p>Public API: {@link com.eneml.ajs.storage.api.FileStorageService}
 * provides upload/download/presigned-URL operations to other modules.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Storage",
    allowedDependencies = { "shared" }
)
package com.eneml.ajs.storage;
