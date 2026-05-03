package com.eneml.ajs.review;

import com.eneml.ajs.identity.api.JwtClaims;
import com.eneml.ajs.identity.api.UserProvisioning;
import com.eneml.ajs.review.api.ReviewAssignmentStatus;
import com.eneml.ajs.review.api.ReviewLookup;
import com.eneml.ajs.review.api.ReviewMethod;
import com.eneml.ajs.review.api.ReviewRecommendation;
import com.eneml.ajs.review.api.ReviewRoundCompleted;
import com.eneml.ajs.review.api.ReviewRoundCreated;
import com.eneml.ajs.review.api.ReviewRoundStatus;
import com.eneml.ajs.review.api.ReviewSubmitted;
import com.eneml.ajs.review.api.ReviewerAccepted;
import com.eneml.ajs.review.api.ReviewerDeclined;
import com.eneml.ajs.review.api.ReviewerInvited;
import com.eneml.ajs.review.internal.application.ReviewService;
import com.eneml.ajs.review.internal.application.ReviewerInboxService;
import com.eneml.ajs.review.internal.web.dto.ReviewSubmissionRequest;
import com.eneml.ajs.review.internal.web.dto.ReviewerInviteRequest;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.submission.api.SubmissionStage;
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
class ReviewModuleIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired ReviewService reviewService;
    @Autowired ReviewerInboxService inboxService;
    @Autowired ReviewLookup reviewLookup;
    @Autowired SubmissionService submissionService;
    @Autowired UserProvisioning provisioning;
    @Autowired ApplicationEvents events;
    @Autowired com.eneml.ajs.journal.api.SectionLookup sectionLookup;

    @Test
    void openRoundEmitsEventAndStartsAtRoundOne() {
        Long submissionId = aSubmission(provisionUser("kc-author", "auth1@test.local"));
        events.clear();

        var round = reviewService.openNextRound(submissionId, SubmissionStage.EXTERNAL_REVIEW);

        assertThat(round.getRoundNumber()).isEqualTo(1);
        assertThat(round.getStatus()).isEqualTo(ReviewRoundStatus.PENDING_REVIEWERS);
        assertThat(events.stream(ReviewRoundCreated.class))
                .singleElement()
                .satisfies(e -> assertThat(e.roundNumber()).isEqualTo(1));
    }

    @Test
    void inviteReviewerTransitionsRoundToInProgressAndEmits() {
        Long author = provisionUser("kc-author2", "auth2@test.local");
        Long reviewer = provisionUser("kc-rev2", "rev2@test.local");
        Long editor = provisionUser("kc-ed2", "ed2@test.local");
        Long submissionId = aSubmission(author);
        var round = reviewService.openNextRound(submissionId, SubmissionStage.EXTERNAL_REVIEW);
        events.clear();

        var assignment = reviewService.invite(round.getId(), new ReviewerInviteRequest(
                reviewer, ReviewMethod.DOUBLE_ANONYMOUS, null, null), editor);

        assertThat(assignment.getStatus()).isEqualTo(ReviewAssignmentStatus.AWAITING_RESPONSE);
        assertThat(reviewService.getRound(round.getId()).getStatus())
                .isEqualTo(ReviewRoundStatus.IN_PROGRESS);
        assertThat(events.stream(ReviewerInvited.class)).hasSize(1);
    }

    @Test
    void reviewerHappyPath_acceptSubmitConfirm() {
        Long author = provisionUser("kc-author3", "auth3@test.local");
        Long reviewer = provisionUser("kc-rev3", "rev3@test.local");
        Long editor = provisionUser("kc-ed3", "ed3@test.local");
        Long submissionId = aSubmission(author);
        var round = reviewService.openNextRound(submissionId, SubmissionStage.EXTERNAL_REVIEW);
        var assignment = reviewService.invite(round.getId(), new ReviewerInviteRequest(
                reviewer, ReviewMethod.ANONYMOUS, null, null), editor);
        events.clear();

        // Accept
        inboxService.respond(assignment.getId(), reviewer, true, null);
        // Submit
        var completed = inboxService.submitReview(assignment.getId(), reviewer,
                new ReviewSubmissionRequest(ReviewRecommendation.REVISIONS,
                        "to editor", "to author", null));
        // Editor confirms
        var confirmed = reviewService.confirm(completed.getId());

        assertThat(confirmed.getStatus()).isEqualTo(ReviewAssignmentStatus.CONFIRMED);
        assertThat(events.stream(ReviewerAccepted.class)).hasSize(1);
        assertThat(events.stream(ReviewSubmitted.class))
                .singleElement()
                .satisfies(e -> assertThat(e.recommendation()).isEqualTo(ReviewRecommendation.REVISIONS));
        // With one assignment confirmed and being the only one, round closes.
        assertThat(events.stream(ReviewRoundCompleted.class)).hasSize(1);
    }

    @Test
    void declineEmitsEventAndPreventsFurtherAction() {
        Long author = provisionUser("kc-author4", "auth4@test.local");
        Long reviewer = provisionUser("kc-rev4", "rev4@test.local");
        Long editor = provisionUser("kc-ed4", "ed4@test.local");
        Long submissionId = aSubmission(author);
        var round = reviewService.openNextRound(submissionId, SubmissionStage.EXTERNAL_REVIEW);
        var assignment = reviewService.invite(round.getId(), new ReviewerInviteRequest(
                reviewer, ReviewMethod.ANONYMOUS, null, null), editor);
        events.clear();

        inboxService.respond(assignment.getId(), reviewer, false, "competing interests");

        assertThat(events.stream(ReviewerDeclined.class)).hasSize(1);
        // Trying to submit a review on a declined assignment should fail.
        assertThatThrownBy(() -> inboxService.submitReview(assignment.getId(), reviewer,
                new ReviewSubmissionRequest(ReviewRecommendation.ACCEPT, null, null, null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void cannotRespondTwiceToTheSameInvitation() {
        Long author = provisionUser("kc-author5", "auth5@test.local");
        Long reviewer = provisionUser("kc-rev5", "rev5@test.local");
        Long editor = provisionUser("kc-ed5", "ed5@test.local");
        Long submissionId = aSubmission(author);
        var round = reviewService.openNextRound(submissionId, SubmissionStage.EXTERNAL_REVIEW);
        var assignment = reviewService.invite(round.getId(), new ReviewerInviteRequest(
                reviewer, ReviewMethod.ANONYMOUS, null, null), editor);

        inboxService.respond(assignment.getId(), reviewer, true, null);

        assertThatThrownBy(() -> inboxService.respond(assignment.getId(), reviewer, false, null))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void reviewLookupExposesRoundsAndOpenAssignments() {
        Long author = provisionUser("kc-author6", "auth6@test.local");
        Long reviewer = provisionUser("kc-rev6", "rev6@test.local");
        Long editor = provisionUser("kc-ed6", "ed6@test.local");
        Long submissionId = aSubmission(author);
        var round = reviewService.openNextRound(submissionId, SubmissionStage.EXTERNAL_REVIEW);
        reviewService.invite(round.getId(), new ReviewerInviteRequest(
                reviewer, ReviewMethod.ANONYMOUS, null, null), editor);

        assertThat(reviewLookup.roundsOf(submissionId)).hasSize(1);
        assertThat(reviewLookup.openAssignmentsForReviewer(reviewer)).hasSize(1);
    }

    private Long aSubmission(Long submitterId) {
        Long sectionId = sectionLookup.findByCode("articles").orElseThrow().id();
        return submissionService.start(
                new SubmissionStartRequest(sectionId, "en"), submitterId).getId();
    }

    private Long provisionUser(String sub, String email) {
        return provisioning.ensureProvisioned(new JwtClaims(
                sub, email, sub, "Test", "User", "en", null, Set.of()));
    }
}
