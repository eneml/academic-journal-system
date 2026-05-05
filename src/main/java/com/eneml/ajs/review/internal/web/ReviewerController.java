package com.eneml.ajs.review.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.review.internal.application.ReviewerInboxService;
import com.eneml.ajs.review.internal.domain.ReviewAssignment;
import com.eneml.ajs.review.internal.web.dto.ReviewAssignmentResponse;
import com.eneml.ajs.review.internal.web.dto.ReviewSubmissionRequest;
import com.eneml.ajs.review.internal.web.dto.ReviewerManuscriptResponse;
import com.eneml.ajs.review.internal.web.dto.ReviewerResponseRequest;
import com.eneml.ajs.review.internal.web.mapper.ReviewMapper;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.storage.api.FileStorageService;
import com.eneml.ajs.storage.api.StoredFileMetadata;
import com.eneml.ajs.submission.api.SubmissionContent;
import com.eneml.ajs.submission.api.SubmissionFileSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
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

import java.time.Duration;
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
    private final SubmissionLookup submissionLookup;
    private final FileStorageService fileStorage;

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

    /**
     * Blinded manuscript view — title, abstract, keywords, and download URLs
     * for the attached files. Author identity is omitted so this endpoint is
     * safe to call regardless of review method (we double-check assignment
     * ownership). The reviewer needs the manuscript to actually do the
     * review; previously the assignment detail page rendered only the
     * accept/decline + recommendation form, which made the review
     * impossible.
     */
    @GetMapping("/{assignmentId}/manuscript")
    @Operation(summary = "Get the (blinded) manuscript belonging to one of my assignments")
    ReviewerManuscriptResponse manuscript(@AuthenticationPrincipal Jwt jwt,
                                          @PathVariable Long assignmentId) {
        Long userId = currentUserId(jwt);
        ReviewAssignment a = service.getMine(assignmentId, userId);
        Long submissionId = service.submissionIdFor(a);

        SubmissionContent content = submissionLookup.findContent(submissionId)
                .orElseThrow(() -> NotFoundException.of("Submission", submissionId));

        List<SubmissionFileSummary> files = submissionLookup.filesOf(submissionId);
        List<ReviewerManuscriptResponse.File> fileDtos = files.stream()
                .map(f -> {
                    StoredFileMetadata meta = f.storedFileId() == null
                            ? null
                            : fileStorage.findById(f.storedFileId()).orElse(null);
                    String url = f.storedFileId() == null
                            ? null
                            : fileStorage.downloadUrl(f.storedFileId(),
                                    Duration.ofMinutes(15)).toString();
                    return new ReviewerManuscriptResponse.File(
                            f.id(),
                            f.fileStage(),
                            meta == null ? "file" : meta.originalFilename(),
                            meta == null ? null : meta.contentType(),
                            meta == null ? 0L : meta.sizeBytes(),
                            url,
                            f.uploadedAt());
                })
                .toList();

        return new ReviewerManuscriptResponse(
                submissionId,
                assignmentId,
                a.getReviewMethod() == null ? null : a.getReviewMethod().name(),
                content.locale(),
                content.title(),
                content.abstractText(),
                content.keywords(),
                fileDtos);
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
