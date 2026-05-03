package com.eneml.ajs.storage;

import com.eneml.ajs.storage.api.FileStorageService;
import com.eneml.ajs.storage.api.FileStored;
import com.eneml.ajs.storage.api.FileUploadRequest;
import com.eneml.ajs.storage.api.StoredFileRef;
import com.eneml.ajs.storage.internal.persistence.StoredFileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@RecordApplicationEvents
@Transactional
class StorageModuleIntegrationTest {

    private static final String BUCKET = "ajs-test";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Container
    static MinIOContainer minio = new MinIOContainer("minio/minio:latest")
            .withUserName("minioadmin")
            .withPassword("minioadminpw");

    @DynamicPropertySource
    static void wireS3(DynamicPropertyRegistry r) {
        r.add("app.storage.s3.endpoint",      minio::getS3URL);
        r.add("app.storage.s3.region",        () -> "us-east-1");
        r.add("app.storage.s3.access-key",    minio::getUserName);
        r.add("app.storage.s3.secret-key",    minio::getPassword);
        r.add("app.storage.s3.bucket",        () -> BUCKET);
        r.add("app.storage.s3.path-style-access", () -> "true");
        r.add("app.storage.s3.presigned-url-ttl-seconds", () -> "300");
    }

    @Autowired FileStorageService storage;
    @Autowired StoredFileRepository repository;
    @Autowired S3Client s3Client;
    @Autowired ApplicationEvents events;

    @Test
    void uploadStoresContentAndPersistsTrackingRow() {
        ensureBucket();
        byte[] payload = "Hello academic journal".getBytes(StandardCharsets.UTF_8);

        StoredFileRef ref = storage.store(new FileUploadRequest(
                new ByteArrayInputStream(payload),
                "text/plain",
                "greeting.txt",
                42L));

        assertThat(ref.id()).isNotNull();
        assertThat(ref.sizeBytes()).isEqualTo(payload.length);
        assertThat(ref.sha256Hex()).hasSize(64);
        assertThat(repository.findById(ref.id())).get()
                .satisfies(f -> {
                    assertThat(f.getOriginalFilename()).isEqualTo("greeting.txt");
                    assertThat(f.getUploadedByUserId()).isEqualTo(42L);
                    assertThat(f.isDeleted()).isFalse();
                });
        assertThat(events.stream(FileStored.class)).hasSize(1);
    }

    @Test
    void uploadingIdenticalContentReusesStoredRow() {
        ensureBucket();
        byte[] payload = "duplicate me".getBytes(StandardCharsets.UTF_8);

        StoredFileRef first = storage.store(new FileUploadRequest(
                new ByteArrayInputStream(payload), "text/plain", "a.txt", 1L));
        StoredFileRef second = storage.store(new FileUploadRequest(
                new ByteArrayInputStream(payload), "text/plain", "b.txt", 2L));

        assertThat(second.id()).isEqualTo(first.id());
        assertThat(second.sha256Hex()).isEqualTo(first.sha256Hex());
    }

    @Test
    void downloadUrlIsPresignedAndPointsAtTheConfiguredBucket() {
        ensureBucket();
        StoredFileRef ref = storage.store(new FileUploadRequest(
                new ByteArrayInputStream("body".getBytes()), "text/plain", "x.txt", null));

        URI url = storage.downloadUrl(ref.id(), Duration.ofMinutes(5));

        assertThat(url.toString())
                .contains(BUCKET)
                .contains("X-Amz-Signature");
    }

    @Test
    void deleteMarksRowAndRemovesFromActiveLookup() {
        ensureBucket();
        StoredFileRef ref = storage.store(new FileUploadRequest(
                new ByteArrayInputStream("ephemeral".getBytes()), "text/plain", "y.txt", null));

        storage.delete(ref.id());

        assertThat(storage.findById(ref.id())).isEmpty();
        assertThat(repository.findById(ref.id())).get()
                .extracting(f -> f.isDeleted())
                .isEqualTo(true);
    }

    private void ensureBucket() {
        var listed = s3Client.listBuckets().buckets().stream()
                .anyMatch(b -> BUCKET.equals(b.name()));
        if (!listed) {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(BUCKET).build());
        }
    }

    /**
     * Build a real S3 client matching test container — used inside tests
     * for direct bucket setup. The application's S3Client bean is what
     * the service-under-test uses; we only need a separate client here
     * because Testcontainers MinIO needs the bucket created at boot.
     */
    static S3Client buildClientFor(MinIOContainer container) {
        return S3Client.builder()
                .endpointOverride(URI.create(container.getS3URL()))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(container.getUserName(), container.getPassword())))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }
}
