package com.eneml.ajs.submission;

import com.eneml.ajs.identity.api.JwtClaims;
import com.eneml.ajs.identity.api.UserProvisioning;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.submission.api.FileStage;
import com.eneml.ajs.submission.api.SubmissionFileUploaded;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionProgress;
import com.eneml.ajs.submission.api.SubmissionStarted;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.api.SubmissionSubmitted;
import com.eneml.ajs.submission.internal.application.SubmissionAuthorService;
import com.eneml.ajs.submission.internal.application.SubmissionFileService;
import com.eneml.ajs.submission.internal.application.SubmissionService;
import com.eneml.ajs.submission.internal.web.dto.SubmissionAuthorUpsertRequest;
import com.eneml.ajs.submission.internal.web.dto.SubmissionDetailsRequest;
import com.eneml.ajs.submission.internal.web.dto.SubmissionStartRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.security.access.AccessDeniedException;
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
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@RecordApplicationEvents
@Transactional
class SubmissionModuleIntegrationTest {

    private static final String BUCKET = "ajs-submission-test";

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

    @Autowired SubmissionService submissionService;
    @Autowired SubmissionAuthorService authorService;
    @Autowired SubmissionFileService fileService;
    @Autowired SubmissionLookup submissionLookup;
    @Autowired UserProvisioning provisioning;
    @Autowired ApplicationEvents events;
    @Autowired S3Client s3Client;

    @Test
    void wizardEndToEnd_startUpdateAddAuthorUploadSubmit() {
        ensureBucket();
        Long userId = provisionUser("kc-author-001", "ann@test.local");

        // Start
        var draft = submissionService.start(
                new SubmissionStartRequest(seedArticlesSection(), "en"),
                userId);
        assertThat(draft.getStatus()).isEqualTo(SubmissionStatus.DRAFT);
        assertThat(events.stream(SubmissionStarted.class)).hasSize(1);

        // Update details
        submissionService.updateDetails(
                draft.getId(),
                new SubmissionDetailsRequest(
                        Map.of("en", "Methods of Phenomenology"),
                        Map.of("en", "An abstract."),
                        List.of("phenomenology", "philosophy"),
                        List.of("Humanities"),
                        null,
                        "Please review",
                        SubmissionProgress.DETAILS),
                userId);

        // Add an author
        var author = authorService.add(draft.getId(), new SubmissionAuthorUpsertRequest(
                "Ann", "Smith", "ann@test.local",
                "0000-0001-2345-6789", "Test University",
                Map.of(), null,
                true, true, userId));
        assertThat(author.getSeq()).isPositive();

        // Upload a file (uses storage:: api)
        var fileResp = fileService.upload(
                draft.getId(), FileStage.SUBMISSION, articleTextGenreId(),
                new ByteArrayInputStream("manuscript body".getBytes(StandardCharsets.UTF_8)),
                "text/plain", "manuscript.txt", "en", userId);
        assertThat(fileResp.contentType()).isEqualTo("text/plain");
        assertThat(events.stream(SubmissionFileUploaded.class))
                .singleElement()
                .satisfies(e -> assertThat(e.fileStage()).isEqualTo(FileStage.SUBMISSION));

        // Submit
        events.clear();
        var finalSubmission = submissionService.submit(draft.getId(), userId);

        assertThat(finalSubmission.getStatus()).isEqualTo(SubmissionStatus.QUEUED);
        assertThat(finalSubmission.getProgress()).isEqualTo(SubmissionProgress.SUBMITTED);
        assertThat(finalSubmission.getDateSubmitted()).isNotNull();
        assertThat(events.stream(SubmissionSubmitted.class)).hasSize(1);
    }

    @Test
    void anotherUserCannotEditSomeoneElsesDraft() {
        ensureBucket();
        Long ann = provisionUser("kc-ann", "ann2@test.local");
        Long bob = provisionUser("kc-bob", "bob@test.local");

        var draft = submissionService.start(
                new SubmissionStartRequest(seedArticlesSection(), "en"), ann);

        assertThatThrownBy(() -> submissionService.updateDetails(
                draft.getId(),
                new SubmissionDetailsRequest(
                        Map.of("en", "stolen"), Map.of(),
                        List.of(), List.of(), null, null, SubmissionProgress.DETAILS),
                bob))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void cannotSubmitTwice() {
        ensureBucket();
        Long userId = provisionUser("kc-twice", "twice@test.local");
        var draft = submissionService.start(
                new SubmissionStartRequest(seedArticlesSection(), "en"), userId);

        submissionService.submit(draft.getId(), userId);

        assertThatThrownBy(() -> submissionService.submit(draft.getId(), userId))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void deleteDraftAllowedOnlyWhileDraft() {
        ensureBucket();
        Long userId = provisionUser("kc-del", "del@test.local");
        var draft = submissionService.start(
                new SubmissionStartRequest(seedArticlesSection(), "en"), userId);
        Long id = draft.getId();

        submissionService.deleteDraft(id, userId);

        assertThat(submissionLookup.findById(id)).isEmpty();
    }

    @Test
    void submissionLookupExposesAuthors() {
        ensureBucket();
        Long userId = provisionUser("kc-look", "look@test.local");
        var draft = submissionService.start(
                new SubmissionStartRequest(seedArticlesSection(), "en"), userId);
        authorService.add(draft.getId(), new SubmissionAuthorUpsertRequest(
                "Pri", "Mary", "pri@test.local", null, null, Map.of(),
                null, true, true, null));
        authorService.add(draft.getId(), new SubmissionAuthorUpsertRequest(
                "Sec", "Ond", "sec@test.local", null, null, Map.of(),
                null, false, true, null));

        var authors = submissionLookup.authorsOf(draft.getId());
        assertThat(authors).extracting(s -> s.email())
                .containsExactly("pri@test.local", "sec@test.local");
    }

    private Long provisionUser(String sub, String email) {
        return provisioning.ensureProvisioned(new JwtClaims(
                sub, email, sub, "Test", "User", "en", null, Set.of()));
    }

    private Long seedArticlesSection() {
        // V20 migration seeds 'articles' as the first section.
        return resolveSectionIdByCode("articles");
    }

    private Long articleTextGenreId() {
        return resolveGenreIdByCode("article-text");
    }

    @Autowired com.eneml.ajs.journal.api.SectionLookup sectionLookup;
    @Autowired com.eneml.ajs.journal.api.GenreLookup genreLookup;

    private Long resolveSectionIdByCode(String code) {
        return sectionLookup.findByCode(code).orElseThrow().id();
    }

    private Long resolveGenreIdByCode(String code) {
        return genreLookup.findByCode(code).orElseThrow().id();
    }

    private void ensureBucket() {
        var listed = s3Client.listBuckets().buckets().stream()
                .anyMatch(b -> BUCKET.equals(b.name()));
        if (!listed) {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(BUCKET).build());
        }
    }

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
