package com.eneml.ajs.submission.internal.web.mapper;

import com.eneml.ajs.storage.api.StoredFileMetadata;
import com.eneml.ajs.submission.internal.domain.SubmissionFile;
import com.eneml.ajs.submission.internal.web.dto.SubmissionFileResponse;
import org.mapstruct.Mapper;

@Mapper
public interface SubmissionFileMapper {

    /**
     * Combines the SubmissionFile row with metadata fetched from the
     * storage module so the client gets size + content-type without a
     * second round-trip.
     */
    default SubmissionFileResponse toResponse(SubmissionFile entity, StoredFileMetadata storedMeta) {
        return new SubmissionFileResponse(
                entity.getId(),
                entity.getSubmissionId(),
                entity.getStoredFileId(),
                entity.getGenreId(),
                entity.getFileStage(),
                entity.getSourceSubmissionFileId(),
                entity.getUploaderUserId(),
                entity.getLocale(),
                entity.getLabel(),
                entity.getDescription(),
                entity.isViewable(),
                entity.getVersion(),
                entity.getUpdatedAt(),
                storedMeta != null ? storedMeta.contentType() : null,
                storedMeta != null ? storedMeta.sizeBytes()  : 0L,
                storedMeta != null ? storedMeta.originalFilename() : null);
    }
}
