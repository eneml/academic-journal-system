package com.eneml.ajs.editorial;

import com.eneml.ajs.editorial.api.DecisionMade;
import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.editorial.api.EditorialLookup;
import com.eneml.ajs.editorial.internal.application.EditorialDecisionService;
import com.eneml.ajs.editorial.internal.engine.DecisionContext;
import com.eneml.ajs.identity.api.JwtClaims;
import com.eneml.ajs.identity.api.UserProvisioning;
import com.eneml.ajs.review.api.ReviewLookup;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStageChanged;
import com.eneml.ajs.submission.api.SubmissionStatus;
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

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@RecordApplicationEvents
@Transactional
class EditorialModuleIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired EditorialDecisionService decisions;
    @Autowired EditorialLookup editorialLookup;
    @Autowired SubmissionLookup submissionLookup;
    @Autowired ReviewLookup reviewLookup;
    @Autowired SubmissionService submissionService;
    @Autowired UserProvisioning provisioning;
    @Autowired ApplicationEvents events;
    @Autowired com.eneml.ajs.journal.api.SectionLookup sectionLookup;

    @Test
    void externalReviewDecisionMovesStageAndOpensRoundOne() {
        Long actor = provisionUser("kc-ed1", "ed1@test.local");
        Long submissionId = aSubmission(actor);
        events.clear();

        decisions.take(submissionId, DecisionType.EXTERNAL_REVIEW,
                new DecisionContext(actor, null, "Sending to external review"));

        var refreshed = submissionLookup.findById(submissionId).orElseThrow();
        assertThat(refreshed.stage()).isEqualTo(SubmissionStage.EXTERNAL_REVIEW);
        assertThat(reviewLookup.roundsOf(submissionId)).hasSize(1);
        assertThat(events.stream(DecisionMade.class)).hasSize(1);
        assertThat(events.stream(SubmissionStageChanged.class)).hasSize(1);
    }

    @Test
    void cannotAcceptFromProductionStage() {
        Long actor = provisionUser("kc-ed2", "ed2@test.local");
        Long submissionId = aSubmission(actor);
        // Walk forward: SUBMISSION -> EXTERNAL_REVIEW -> EDITING -> PRODUCTION
        decisions.take(submissionId, DecisionType.EXTERNAL_REVIEW,
                new DecisionContext(actor, null, null));
        decisions.take(submissionId, DecisionType.ACCEPT,
                new DecisionContext(actor, null, null));
        decisions.take(submissionId, DecisionType.SEND_TO_PRODUCTION,
                new DecisionContext(actor, null, null));

        // ACCEPT is invalid from PRODUCTION
        assertThatThrownBy(() -> decisions.take(submissionId, DecisionType.ACCEPT,
                new DecisionContext(actor, null, null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void resubmitForReviewKeepsStageButOpensNewRound() {
        Long actor = provisionUser("kc-ed3", "ed3@test.local");
        Long submissionId = aSubmission(actor);
        decisions.take(submissionId, DecisionType.EXTERNAL_REVIEW,
                new DecisionContext(actor, null, null));
        assertThat(reviewLookup.roundsOf(submissionId)).hasSize(1);
        events.clear();

        decisions.take(submissionId, DecisionType.RESUBMIT_FOR_REVIEW,
                new DecisionContext(actor, null, "Major revisions"));

        assertThat(submissionLookup.findById(submissionId).orElseThrow().stage())
                .isEqualTo(SubmissionStage.EXTERNAL_REVIEW);
        assertThat(reviewLookup.roundsOf(submissionId)).hasSize(2);
        assertThat(events.stream(SubmissionStageChanged.class))
                .as("stage didn't actually change so no SubmissionStageChanged should fire")
                .isEmpty();
    }

    @Test
    void initialDeclineSetsStatusDeclined() {
        Long actor = provisionUser("kc-ed4", "ed4@test.local");
        Long submissionId = aSubmission(actor);

        decisions.take(submissionId, DecisionType.INITIAL_DECLINE,
                new DecisionContext(actor, null, "Out of scope"));

        var refreshed = submissionLookup.findById(submissionId).orElseThrow();
        assertThat(refreshed.status()).isEqualTo(SubmissionStatus.DECLINED);
        assertThat(refreshed.stage()).isEqualTo(SubmissionStage.SUBMISSION);
    }

    @Test
    void historyExposesAllDecisionsInOrder() {
        Long actor = provisionUser("kc-ed5", "ed5@test.local");
        Long submissionId = aSubmission(actor);
        decisions.take(submissionId, DecisionType.EXTERNAL_REVIEW, new DecisionContext(actor, null, null));
        decisions.take(submissionId, DecisionType.REQUEST_REVISIONS, new DecisionContext(actor, null, null));
        decisions.take(submissionId, DecisionType.ACCEPT, new DecisionContext(actor, null, null));
        decisions.take(submissionId, DecisionType.SEND_TO_PRODUCTION, new DecisionContext(actor, null, null));

        var history = editorialLookup.historyOf(submissionId);
        assertThat(history).extracting(s -> s.decisionType()).containsExactly(
                DecisionType.EXTERNAL_REVIEW,
                DecisionType.REQUEST_REVISIONS,
                DecisionType.ACCEPT,
                DecisionType.SEND_TO_PRODUCTION);
    }

    @Test
    void cancelReviewRoundCancelsLatestWithoutMovingStage() {
        Long actor = provisionUser("kc-ed6", "ed6@test.local");
        Long submissionId = aSubmission(actor);
        decisions.take(submissionId, DecisionType.EXTERNAL_REVIEW,
                new DecisionContext(actor, null, null));
        Long roundId = reviewLookup.latestRound(submissionId).orElseThrow().id();

        decisions.take(submissionId, DecisionType.CANCEL_REVIEW_ROUND,
                new DecisionContext(actor, roundId, null));

        assertThat(submissionLookup.findById(submissionId).orElseThrow().stage())
                .isEqualTo(SubmissionStage.EXTERNAL_REVIEW);
        assertThat(reviewLookup.latestRound(submissionId).orElseThrow().status())
                .isEqualTo(com.eneml.ajs.review.api.ReviewRoundStatus.CANCELLED);
    }

    private Long aSubmission(Long submitterId) {
        Long sectionId = sectionLookup.findByCode("articles").orElseThrow().id();
        var draft = submissionService.start(
                new SubmissionStartRequest(sectionId, "en"), submitterId);
        // Move out of DRAFT — workflow engine expects a real submission
        return submissionService.submit(draft.getId(), submitterId).getId();
    }

    private Long provisionUser(String sub, String email) {
        return provisioning.ensureProvisioned(new JwtClaims(
                sub, email, sub, "Test", "User", "en", null, Set.of()));
    }
}
