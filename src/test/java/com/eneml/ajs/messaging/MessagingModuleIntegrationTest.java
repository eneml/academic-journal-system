package com.eneml.ajs.messaging;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.internal.application.EditorialDecisionService;
import com.eneml.ajs.editorial.internal.engine.DecisionContext;
import com.eneml.ajs.identity.api.JwtClaims;
import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.UserProvisioning;
import com.eneml.ajs.identity.internal.application.UserRoleService;
import com.eneml.ajs.messaging.api.NotificationLookup;
import com.eneml.ajs.messaging.api.NotificationType;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import com.eneml.ajs.review.api.ReviewMethod;
import com.eneml.ajs.review.internal.application.ReviewService;
import com.eneml.ajs.review.internal.web.dto.ReviewerInviteRequest;
import com.eneml.ajs.submission.internal.application.SubmissionService;
import com.eneml.ajs.submission.internal.web.dto.SubmissionStartRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static java.time.Duration.ofSeconds;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class MessagingModuleIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired NotificationService notifications;
    @Autowired NotificationLookup notificationLookup;
    @Autowired SubmissionService submissionService;
    @Autowired EditorialDecisionService editorialService;
    @Autowired ReviewService reviewService;
    @Autowired UserProvisioning provisioning;
    @Autowired UserRoleService roleService;
    @Autowired com.eneml.ajs.journal.api.SectionLookup sectionLookup;

    @Test
    @Transactional
    void unreadCountStartsAtZero() {
        Long userId = provisionUser("kc-mn1", "n1@test.local");
        assertThat(notificationLookup.unreadCountForUser(userId)).isZero();
    }

    @Test
    @Transactional
    void markReadFlipsReadFlag() {
        Long userId = provisionUser("kc-mn2", "n2@test.local");
        var n = notifications.create(new com.eneml.ajs.messaging.internal.application.NotificationDraft(
                userId, "test", null, "title", "body", "x", 1L, "/x"));

        notifications.markRead(n.getId(), userId);

        assertThat(notificationLookup.unreadCountForUser(userId)).isZero();
    }

    @Test
    void submissionSubmittedNotifiesEditors() {
        Long author = provisionUser("kc-mns-a", "auth@msg.test");
        Long editor = provisionUser("kc-mns-e", "ed@msg.test");
        // Grant EDITOR role locally so the directory finds them
        roleService.assign(editor, Role.EDITOR, null, null);

        Long sectionId = sectionLookup.findByCode("articles").orElseThrow().id();
        var draft = submissionService.start(new SubmissionStartRequest(sectionId, "en"), author);
        submissionService.submit(draft.getId(), author);

        // Listener fires after-commit (Modulith outbox); poll briefly.
        await().atMost(ofSeconds(5)).untilAsserted(() -> {
            var inbox = notificationLookup.recentForUser(editor, 10);
            assertThat(inbox)
                    .as("editor inbox should have a SUBMISSION_SUBMITTED notification")
                    .extracting(s -> s.type())
                    .contains(NotificationType.SUBMISSION_SUBMITTED);
        });
    }

    @Test
    void decisionAcceptNotifiesAuthor() {
        Long author = provisionUser("kc-mnd-a", "adec@msg.test");
        Long editor = provisionUser("kc-mnd-e", "edec@msg.test");
        roleService.assign(editor, Role.EDITOR, null, null);

        Long sectionId = sectionLookup.findByCode("articles").orElseThrow().id();
        var draft = submissionService.start(new SubmissionStartRequest(sectionId, "en"), author);
        Long submissionId = submissionService.submit(draft.getId(), author).getId();

        editorialService.take(submissionId, DecisionType.SKIP_REVIEW,
                new DecisionContext(editor, null, null));

        await().atMost(ofSeconds(5)).untilAsserted(() -> {
            var inbox = notificationLookup.recentForUser(author, 10);
            assertThat(inbox)
                    .extracting(s -> s.type())
                    .contains(NotificationType.DECISION_ACCEPT);
        });
    }

    @Test
    void reviewerInvitationLandsInReviewerInbox() {
        Long author = provisionUser("kc-mnr-a", "arev@msg.test");
        Long editor = provisionUser("kc-mnr-e", "erev@msg.test");
        Long reviewer = provisionUser("kc-mnr-r", "rrev@msg.test");
        roleService.assign(editor, Role.EDITOR, null, null);

        Long sectionId = sectionLookup.findByCode("articles").orElseThrow().id();
        var draft = submissionService.start(new SubmissionStartRequest(sectionId, "en"), author);
        Long submissionId = submissionService.submit(draft.getId(), author).getId();
        editorialService.take(submissionId, DecisionType.EXTERNAL_REVIEW,
                new DecisionContext(editor, null, null));
        var round = reviewService.roundsOf(submissionId).get(0);
        reviewService.invite(round.getId(),
                new ReviewerInviteRequest(reviewer, ReviewMethod.ANONYMOUS, null, null), editor);

        await().atMost(ofSeconds(5)).untilAsserted(() -> {
            assertThat(notificationLookup.recentForUser(reviewer, 10))
                    .extracting(s -> s.type())
                    .contains(NotificationType.REVIEWER_INVITED);
        });
    }

    private Long provisionUser(String sub, String email) {
        return provisioning.ensureProvisioned(new JwtClaims(
                sub, email, sub, "Test", "User", "en", null, Set.of()));
    }
}
