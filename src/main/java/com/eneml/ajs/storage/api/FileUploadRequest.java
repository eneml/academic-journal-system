package com.eneml.ajs.storage.api;

import java.io.InputStream;

public record FileUploadRequest(
        InputStream content,
        String contentType,
        String originalFilename,
        Long uploadedByUserId
) {
}
