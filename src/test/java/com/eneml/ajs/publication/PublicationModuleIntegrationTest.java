package com.eneml.ajs.publication;

import com.eneml.ajs.identity.api.JwtClaims;
import com.eneml.ajs.identity.api.UserProvisioning;
import com.eneml.ajs.publication.api.AccessStatus;
import com.eneml.ajs.publication.api.PublicationDrafted;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationPublished;
import com.eneml.ajs.publication.api.PublicationStatus;
import com.eneml.ajs.publication.api.PublicationUnpublished;
import com.eneml.ajs.publication.api.PublicationVersioned;
import com.eneml.ajs.publication.internal.application.PublicationService;
import com.eneml.ajs.publication.internal.web.dto.PublicationUpsertRequest;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.submission.internal.application.SubmissionService;
import com.eneml.ajs.submission.internal.web.dto.SubmissionStartRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

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
class PublicationModuleIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired PublicationService publications;
    @Autowired PublicationLookup publicationLookup;
    @Autowired SubmissionService submissionService;
    @Autowired UserProvisioning provisioning;
    @Autowired ApplicationEvents events;
    @Autowired com.eneml.ajs.journal.api.SectionLookup sectionLookup;

    @Test
    void draftFirstVersionCopiesSectionAndTitleFromSubmission() {
        Long actor = provisionUser("kc-pub1", "p1@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "On Phenomenology"));
        events.clear();

        var draft = publications.draftFirstVersion(submissionId);

        assertThat(draft.getVersionNumber()).isEqualTo(1);
        assertThat(draft.getStatus()).isEqualTo(PublicationStatus.DRAFT);
        assertThat(draft.getSectionId()).isEqualTo(articlesSectionId());
        assertThat(draft.getTitle()).containsEntry("en", "On Phenomenology");
        assertThat(events.stream(PublicationDrafted.class)).hasSize(1);
    }

    @Test
    void cannotDraftFirstVersionTwice() {
        Long actor = provisionUser("kc-pub2", "p2@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "X"));
        publications.draftFirstVersion(submissionId);

        assertThatThrownBy(() -> publications.draftFirstVersion(submissionId))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void updateAppliesMetadataWhileInDraft() {
        Long actor = provisionUser("kc-pub3", "p3@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "X"));
        var draft = publications.draftFirstVersion(submissionId);

        var updated = publications.update(draft.getId(), upsertRequest("Revised Title", "rev-1"));

        assertThat(updated.getTitle()).containsEntry("en", "Revised Title");
        assertThat(updated.getUrlPath()).isEqualTo("rev-1");
        assertThat(updated.getStatus()).isEqualTo(PublicationStatus.DRAFT);
    }

    @Test
    void publishSetsStatusAndDateAndEmitsEvent() {
        Long actor = provisionUser("kc-pub4", "p4@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "Title"));
        var draft = publications.draftFirstVersion(submissionId);
        publications.update(draft.getId(), upsertRequest("Final Title", "final-pub"));
        events.clear();

        var published = publications.publish(draft.getId());

        assertThat(published.getStatus()).isEqualTo(PublicationStatus.PUBLISHED);
        assertThat(published.getDatePublished()).isNotNull();
        assertThat(events.stream(PublicationPublished.class)).hasSize(1);
    }

    @Test
    void cannotEditPublishedPublication() {
        Long actor = provisionUser("kc-pub5", "p5@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "Title"));
        var draft = publications.draftFirstVersion(submissionId);
        publications.update(draft.getId(), upsertRequest("T", "p5"));
        publications.publish(draft.getId());

        assertThatThrownBy(() -> publications.update(draft.getId(),
                upsertRequest("Forbidden Edit", "p5")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void createNextVersionClonesMetadataAndIncrementsVersion() {
        Long actor = provisionUser("kc-pub6", "p6@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "Title"));
        var v1 = publications.draftFirstVersion(submissionId);
        publications.update(v1.getId(), upsertRequest("Original", "orig"));
        publications.publish(v1.getId());
        events.clear();

        var v2 = publications.createNextVersion(v1.getId());

        assertThat(v2.getVersionNumber()).isEqualTo(2);
        assertThat(v2.getStatus()).isEqualTo(PublicationStatus.DRAFT);
        assertThat(v2.getTitle()).containsEntry("en", "Original");
        assertThat(events.stream(PublicationVersioned.class))
                .singleElement()
                .satisfies(e -> assertThat(e.newVersion()).isEqualTo(2));
    }

    @Test
    void unpublishMovesToUnpublishedAndEmits() {
        Long actor = provisionUser("kc-pub7", "p7@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "Title"));
        var draft = publications.draftFirstVersion(submissionId);
        publications.update(draft.getId(), upsertRequest("Live", "live"));
        publications.publish(draft.getId());
        events.clear();

        publications.unpublish(draft.getId());

        assertThat(publicationLookup.findById(draft.getId()).orElseThrow().status())
                .isEqualTo(PublicationStatus.UNPUBLISHED);
        assertThat(events.stream(PublicationUnpublished.class)).hasSize(1);
    }

    @Test
    void publicationLookupExposesVersionsAndLatest() {
        Long actor = provisionUser("kc-pub8", "p8@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "Title"));
        var v1 = publications.draftFirstVersion(submissionId);
        publications.update(v1.getId(), upsertRequest("v1", "p8"));
        publications.publish(v1.getId());
        publications.createNextVersion(v1.getId());

        assertThat(publicationLookup.versionsOf(submissionId)).hasSize(2);
        assertThat(publicationLookup.currentOf(submissionId).orElseThrow().version())
                .isEqualTo(2);
    }

    @Test
    void latestPublishedRespectsLimit() {
        Long actor = provisionUser("kc-pub9", "p9@test.local");
        for (int i = 0; i < 4; i++) {
            Long sId = aSubmission(actor, Map.of("en", "T" + i));
            var pub = publications.draftFirstVersion(sId);
            publications.update(pub.getId(), upsertRequest("T" + i, "t-" + i));
            publications.publish(pub.getId());
        }

        assertThat(publicationLookup.latestPublished(2)).hasSize(2);
    }

    private Long aSubmission(Long submitterId, Map<String, String> title) {
        Long sectionId = articlesSectionId();
        var draft = submissionService.start(
                new SubmissionStartRequest(sectionId, "en"), submitterId);
        var s = submissionService.get(draft.getId());
        s.setTitle(title);
        return submissionService.submit(draft.getId(), submitterId).getId();
    }

    private Long articlesSectionId() {
        return sectionLookup.findByCode("articles").orElseThrow().id();
    }

    private Long provisionUser(String sub, String email) {
        return provisioning.ensureProvisioned(new JwtClaims(
                sub, email, sub, "Test", "User", "en", null, Set.of()));
    }

    private PublicationUpsertRequest upsertRequest(String title, String urlPath) {
        return new PublicationUpsertRequest(
                AccessStatus.OPEN,
                articlesSectionId(),
                null,
                null,
                urlPath,
                null,
                null,
                null,
                null,
                Map.of("en", title),
                Map.of(),
                List.of(),
                List.of(),
                "en");
    }
}
