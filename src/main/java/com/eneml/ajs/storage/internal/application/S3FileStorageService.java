package com.eneml.ajs.storage.internal.application;

import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.storage.api.FileDeleted;
import com.eneml.ajs.storage.api.FileStorageService;
import com.eneml.ajs.storage.api.FileStored;
import com.eneml.ajs.storage.api.FileUploadRequest;
import com.eneml.ajs.storage.api.StoredFileMetadata;
import com.eneml.ajs.storage.api.StoredFileRef;
import com.eneml.ajs.storage.internal.config.StorageProperties;
import com.eneml.ajs.storage.internal.domain.StoredFile;
import com.eneml.ajs.storage.internal.persistence.StoredFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
class S3FileStorageService implements FileStorageService {

    private final StoredFileRepository repository;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final StorageProperties props;
    private final ApplicationEventPublisher events;

    @Override
    @Transactional
    public StoredFileRef store(FileUploadRequest request) {
        byte[] bytes = readAllAndCompute(request.content());
        String sha256 = sha256Hex(bytes);

        // Deduplication: same content already stored?
        Optional<StoredFile> existing = repository.findBySha256(sha256);
        if (existing.isPresent() && !existing.get().isDeleted()) {
            StoredFile e = existing.get();
            return new StoredFileRef(e.getId(), e.getContentType(), e.getSizeBytes(), sha256);
        }

        String s3Key = buildKey(sha256, request.originalFilename());
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(props.bucket())
                        .key(s3Key)
                        .contentType(request.contentType())
                        .contentLength((long) bytes.length)
                        .build(),
                RequestBody.fromBytes(bytes));

        StoredFile entity = new StoredFile();
        entity.setS3Key(s3Key);
        entity.setContentType(request.contentType());
        entity.setSizeBytes(bytes.length);
        entity.setSha256(sha256);
        entity.setOriginalFilename(request.originalFilename());
        entity.setUploadedByUserId(request.uploadedByUserId());
        StoredFile saved = repository.save(entity);

        events.publishEvent(FileStored.of(saved.getId(), saved.getContentType(),
                saved.getSizeBytes(), saved.getUploadedByUserId()));
        return new StoredFileRef(saved.getId(), saved.getContentType(),
                saved.getSizeBytes(), sha256);
    }

    @Override
    public URI downloadUrl(Long fileId, Duration ttl) {
        StoredFile file = repository.findActiveById(fileId)
                .orElseThrow(() -> NotFoundException.of("StoredFile", fileId));
        var presigned = s3Presigner.presignGetObject(GetObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .getObjectRequest(GetObjectRequest.builder()
                        .bucket(props.bucket())
                        .key(file.getS3Key())
                        .build())
                .build());
        return presigned.url().toString().transform(URI::create);
    }

    @Override
    public Optional<StoredFileMetadata> findById(Long fileId) {
        return repository.findActiveById(fileId).map(this::toMetadata);
    }

    @Override
    @Transactional
    public void delete(Long fileId) {
        StoredFile file = repository.findActiveById(fileId)
                .orElseThrow(() -> NotFoundException.of("StoredFile", fileId));
        file.markDeleted();
        events.publishEvent(FileDeleted.of(fileId));
    }

    private StoredFileMetadata toMetadata(StoredFile entity) {
        return new StoredFileMetadata(
                entity.getId(), entity.getContentType(), entity.getSizeBytes(),
                entity.getSha256(), entity.getOriginalFilename(),
                entity.getUploadedByUserId(), entity.getCreatedAt());
    }

    private static byte[] readAllAndCompute(InputStream in) {
        try (in) {
            return in.readAllBytes();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read upload payload", ex);
        }
    }

    private static String sha256Hex(byte[] bytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(bytes));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

    private static String buildKey(String sha256, String originalFilename) {
        // Two-level prefix scatters keys to avoid hot prefixes on S3-compatible
        // backends; UUID suffix keeps the same content uploaded twice in
        // distinct rows if a previous one was deleted.
        String prefix = sha256.substring(0, 2) + "/" + sha256.substring(2, 4) + "/";
        String unique = UUID.randomUUID().toString();
        String safe = sanitize(originalFilename);
        return prefix + sha256 + "-" + unique + (safe == null ? "" : "-" + safe);
    }

    private static String sanitize(String name) {
        if (name == null || name.isBlank()) return null;
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
