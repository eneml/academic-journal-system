package com.eneml.ajs.submission.internal.application;

import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.storage.api.FileStorageService;
import com.eneml.ajs.storage.api.FileUploadRequest;
import com.eneml.ajs.storage.api.StoredFileRef;
import com.eneml.ajs.submission.api.FileStage;
import com.eneml.ajs.submission.api.SubmissionFileSummary;
import com.eneml.ajs.submission.api.SubmissionFileUploaded;
import com.eneml.ajs.submission.api.SubmissionFiles;
import com.eneml.ajs.submission.internal.domain.SubmissionFile;
import com.eneml.ajs.submission.internal.persistence.SubmissionFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Implementation of {@link SubmissionFiles}. Mirrors the upload path used by
 * {@code SubmissionFileService} but doesn't validate the genre against
 * journal::api — callers in other modules pass a known-good seeded genre
 * (e.g. {@code reviewer-attachment}) and the storage row is the source of
 * truth for the eventual file panel.
 */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class SubmissionFilesAdapter implements SubmissionFiles {

    private final SubmissionFileRepository repository;
    private final FileStorageService storage;
    private final ApplicationEventPublisher events;

    @Override
    @Transactional
    public SubmissionFileSummary upload(Long submissionId,
                                        FileStage fileStage,
                                        Long genreId,
                                        InputStream content,
                                        String contentType,
                                        String originalFilename,
                                        String locale,
                                        Long uploaderUserId) {
        StoredFileRef storedRef = storage.store(new FileUploadRequest(
                content, contentType, originalFilename, uploaderUserId));

        SubmissionFile entity = new SubmissionFile();
        entity.setSubmissionId(submissionId);
        entity.setStoredFileId(storedRef.id());
        entity.setGenreId(genreId);
        entity.setFileStage(fileStage);
        entity.setUploaderUserId(uploaderUserId);
        entity.setLocale(locale);
        Map<String, String> defaultLabel = new HashMap<>();
        if (locale != null && originalFilename != null) {
            defaultLabel.put(locale, originalFilename);
        }
        entity.setLabel(defaultLabel);
        SubmissionFile saved = repository.save(entity);

        events.publishEvent(SubmissionFileUploaded.of(submissionId, saved.getId(),
                storedRef.id(), fileStage, uploaderUserId));

        return toSummary(saved);
    }

    @Override
    public Optional<SubmissionFileSummary> findById(Long fileId) {
        return repository.findById(fileId).map(this::toSummary);
    }

    @Override
    public List<SubmissionFileSummary> listByStage(Long submissionId, FileStage fileStage) {
        return repository.findBySubmissionIdAndFileStage(submissionId, fileStage).stream()
                .map(this::toSummary)
                .toList();
    }

    @Override
    public URI downloadUrl(Long fileId, Duration ttl) {
        SubmissionFile f = repository.findById(fileId).orElseThrow(() ->
                NotFoundException.of("SubmissionFile", fileId));
        return storage.downloadUrl(f.getStoredFileId(), ttl);
    }

    @Override
    @Transactional
    public void delete(Long submissionId, Long fileId) {
        SubmissionFile f = repository.findById(fileId).orElseThrow(() ->
                NotFoundException.of("SubmissionFile", fileId));
        if (!f.getSubmissionId().equals(submissionId)) {
            throw NotFoundException.of("SubmissionFile on submission " + submissionId, fileId);
        }
        repository.delete(f);
    }

    @Override
    public List<SubmissionFileSummary> findChildrenByParent(Long parentFileId) {
        return repository.findByParentSubmissionFileId(parentFileId).stream()
                .map(this::toSummary)
                .toList();
    }

    private SubmissionFileSummary toSummary(SubmissionFile f) {
        return new SubmissionFileSummary(
                f.getId(),
                f.getSubmissionId(),
                f.getFileStage(),
                f.getStoredFileId(),
                f.getUploaderUserId(),
                f.getParentSubmissionFileId(),
                f.getCreatedAt());
    }
}
