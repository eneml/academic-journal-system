package com.eneml.ajs.review.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.review.internal.application.ReviewerInboxService;
import com.eneml.ajs.review.internal.web.dto.ReviewAssignmentResponse;
import com.eneml.ajs.review.internal.web.dto.ReviewSubmissionRequest;
import com.eneml.ajs.review.internal.web.dto.ReviewerResponseRequest;
import com.eneml.ajs.review.internal.web.mapper.ReviewMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviewer/assignments")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Review (reviewer)", description = "Reviewer-side inbox: respond and submit reviews")
class ReviewerController {

    private final ReviewerInboxService service;
    private final ReviewMapper mapper;
    private final UserDirectoryService userDirectory;

    @GetMapping
    @Operation(summary = "List the current user's open review assignments")
    List<ReviewAssignmentResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return mapper.toAssignmentResponses(service.myOpen(currentUserId(jwt)));
    }

    @GetMapping("/{assignmentId}")
    @Operation(summary = "Get one of my assignments")
    ReviewAssignmentResponse get(@AuthenticationPrincipal Jwt jwt,
                                  @PathVariable Long assignmentId) {
        return mapper.toResponse(service.getMine(assignmentId, currentUserId(jwt)));
    }

    @PostMapping("/{assignmentId}/respond")
    @Operation(summary = "Accept or decline a review assignment")
    ReviewAssignmentResponse respond(@AuthenticationPrincipal Jwt jwt,
                                      @PathVariable Long assignmentId,
                                      @Valid @RequestBody ReviewerResponseRequest request) {
        return mapper.toResponse(service.respond(
                assignmentId, currentUserId(jwt), request.accept(), request.message()));
    }

    @PostMapping("/{assignmentId}/submit")
    @Operation(summary = "Submit the review with recommendation + comments")
    ReviewAssignmentResponse submit(@AuthenticationPrincipal Jwt jwt,
                                     @PathVariable Long assignmentId,
                                     @Valid @RequestBody ReviewSubmissionRequest request) {
        return mapper.toResponse(service.submitReview(
                assignmentId, currentUserId(jwt), request));
    }

    private Long currentUserId(Jwt jwt) {
        return userDirectory.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()))
                .id();
    }
}
