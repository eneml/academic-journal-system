package com.eneml.ajs.submission.internal.application;

import com.eneml.ajs.journal.api.GenreLookup;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.storage.api.FileStorageService;
import com.eneml.ajs.storage.api.FileUploadRequest;
import com.eneml.ajs.storage.api.StoredFileMetadata;
import com.eneml.ajs.storage.api.StoredFileRef;
import com.eneml.ajs.submission.api.FileStage;
import com.eneml.ajs.submission.api.SubmissionFileUploaded;
import com.eneml.ajs.submission.internal.domain.SubmissionFile;
import com.eneml.ajs.submission.internal.persistence.SubmissionFileRepository;
import com.eneml.ajs.submission.internal.web.dto.SubmissionFileResponse;
import com.eneml.ajs.submission.internal.web.mapper.SubmissionFileMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionFileService {

    private static final Duration DEFAULT_DOWNLOAD_TTL = Duration.ofMinutes(15);

    private final SubmissionFileRepository repository;
    private final FileStorageService storage;
    private final GenreLookup genreLookup;
    private final SubmissionFileMapper mapper;
    private final ApplicationEventPublisher events;

    public List<SubmissionFileResponse> list(Long submissionId) {
        return repository.findBySubmissionId(submissionId).stream()
                .map(f -> mapper.toResponse(f, storage.findById(f.getStoredFileId()).orElse(null)))
                .toList();
    }

    public SubmissionFile get(Long fileId) {
        return repository.findById(fileId).orElseThrow(() ->
                NotFoundException.of("SubmissionFile", fileId));
    }

    @Transactional
    public SubmissionFileResponse upload(Long submissionId,
                                         FileStage fileStage,
                                         Long genreId,
                                         InputStream content,
                                         String contentType,
                                         String originalFilename,
                                         String locale,
                                         Long uploaderUserId) {
        if (genreLookup.findById(genreId).isEmpty()) {
            throw new ConflictException("Genre %d does not exist".formatted(genreId));
        }

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

        StoredFileMetadata meta = storage.findById(storedRef.id()).orElse(null);
        return mapper.toResponse(saved, meta);
    }

    public URI downloadUrl(Long fileId) {
        SubmissionFile f = get(fileId);
        return storage.downloadUrl(f.getStoredFileId(), DEFAULT_DOWNLOAD_TTL);
    }

    @Transactional
    public void remove(Long submissionId, Long fileId) {
        SubmissionFile f = get(fileId);
        if (!f.getSubmissionId().equals(submissionId)) {
            throw NotFoundException.of("SubmissionFile on submission " + submissionId, fileId);
        }
        repository.delete(f);
        // The underlying StoredFile stays — it may be referenced by other
        // SubmissionFile rows (revision lineage, copy across stages).
    }
}
