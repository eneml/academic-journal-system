package com.eneml.ajs.review.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.review.internal.application.ReviewService;
import com.eneml.ajs.review.internal.web.dto.ReviewAssignmentResponse;
import com.eneml.ajs.review.internal.web.dto.ReviewRoundResponse;
import com.eneml.ajs.review.internal.web.dto.ReviewerInviteRequest;
import com.eneml.ajs.review.internal.web.mapper.ReviewMapper;
import com.eneml.ajs.submission.api.SubmissionStage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions/{submissionId}/review-rounds")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
@Tag(name = "Review (editor)", description = "Round and reviewer-assignment management")
class ReviewController {

    private final ReviewService service;
    private final ReviewMapper mapper;
    private final UserDirectoryService userDirectory;

    @GetMapping
    @Operation(summary = "List rounds for a submission")
    List<ReviewRoundResponse> rounds(@PathVariable Long submissionId) {
        return mapper.toRoundResponses(service.roundsOf(submissionId));
    }

    @PostMapping
    @Operation(summary = "Open the next review round for a submission")
    ReviewRoundResponse openRound(@PathVariable Long submissionId,
                                   @RequestParam(defaultValue = "EXTERNAL_REVIEW") SubmissionStage stage) {
        return mapper.toResponse(service.openNextRound(submissionId, stage));
    }

    @GetMapping("/{roundId}/assignments")
    @Operation(summary = "List reviewer assignments for a round")
    List<ReviewAssignmentResponse> assignments(@PathVariable Long submissionId,
                                                @PathVariable Long roundId) {
        return mapper.toAssignmentResponses(service.assignmentsOf(roundId));
    }

    @PostMapping("/{roundId}/assignments")
    @Operation(summary = "Invite a reviewer to the round")
    ReviewAssignmentResponse invite(@AuthenticationPrincipal Jwt jwt,
                                     @PathVariable Long submissionId,
                                     @PathVariable Long roundId,
                                     @Valid @RequestBody ReviewerInviteRequest request) {
        Long invitedBy = currentUserId(jwt);
        return mapper.toResponse(service.invite(roundId, request, invitedBy));
    }

    @PostMapping("/{roundId}/assignments/{assignmentId}/confirm")
    @Operation(summary = "Confirm receipt of a completed review")
    ReviewAssignmentResponse confirm(@PathVariable Long submissionId,
                                      @PathVariable Long roundId,
                                      @PathVariable Long assignmentId) {
        return mapper.toResponse(service.confirm(assignmentId));
    }

    @PostMapping("/{roundId}/assignments/{assignmentId}/cancel")
    @Operation(summary = "Cancel a reviewer assignment (silent)")
    ResponseEntity<Void> cancel(@PathVariable Long submissionId,
                                 @PathVariable Long roundId,
                                 @PathVariable Long assignmentId) {
        service.cancel(assignmentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{roundId}/assignments/{assignmentId}/resend")
    @Operation(summary = "Re-fire the original review-request email")
    ReviewAssignmentResponse resend(@PathVariable Long submissionId,
                                     @PathVariable Long roundId,
                                     @PathVariable Long assignmentId) {
        return mapper.toResponse(service.resendInvitation(assignmentId));
    }

    @PostMapping("/{roundId}/assignments/{assignmentId}/reinstate")
    @Operation(summary = "Reinstate a previously declined assignment")
    ReviewAssignmentResponse reinstate(@PathVariable Long submissionId,
                                        @PathVariable Long roundId,
                                        @PathVariable Long assignmentId) {
        return mapper.toResponse(service.reinstate(assignmentId));
    }

    @PostMapping("/{roundId}/assignments/{assignmentId}/unassign")
    @Operation(summary = "Unassign a reviewer + email them")
    ReviewAssignmentResponse unassign(@PathVariable Long submissionId,
                                       @PathVariable Long roundId,
                                       @PathVariable Long assignmentId) {
        return mapper.toResponse(service.unassign(assignmentId));
    }

    private Long currentUserId(Jwt jwt) {
        return userDirectory.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()))
                .id();
    }
}
