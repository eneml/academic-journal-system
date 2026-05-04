package com.eneml.ajs.storage.api;

import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.Optional;

/**
 * Storage abstraction other modules use to persist and retrieve binary
 * content. Implementation is S3-compatible (Cloudflare R2 in prod, MinIO
 * in dev). Modules never see the underlying S3 keys — they hold a
 * {@link StoredFileRef#id()} and ask for download URLs on demand.
 */
public interface FileStorageService {

    /**
     * Uploads the request payload, computes its sha256, persists a
     * tracking row, and returns a handle.
     */
    StoredFileRef store(FileUploadRequest request);

    /**
     * @return a short-lived presigned URL the caller can hand to the
     *         browser/client. The URL is valid only for {@code ttl}.
     */
    URI downloadUrl(Long fileId, Duration ttl);

    /**
     * Server-side stream of the underlying object's bytes. Use this when
     * the server itself needs to read the content (e.g. PDF merge for an
     * issue download); for browser delivery prefer {@link #downloadUrl}
     * to avoid proxying through the app. The caller is responsible for
     * closing the stream.
     */
    InputStream openInputStream(Long fileId);

    Optional<StoredFileMetadata> findById(Long fileId);

    /** Soft-deletes; an async sweep removes the S3 object later. */
    void delete(Long fileId);
}
