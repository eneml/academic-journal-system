package com.eneml.ajs.discussion.internal.web;

import com.eneml.ajs.discussion.api.DiscussionMessageSummary;
import com.eneml.ajs.discussion.api.DiscussionSummary;
import com.eneml.ajs.discussion.internal.application.DiscussionService;
import com.eneml.ajs.discussion.internal.web.dto.AddParticipantRequest;
import com.eneml.ajs.discussion.internal.web.dto.DiscussionMessageRequest;
import com.eneml.ajs.discussion.internal.web.dto.DiscussionOpenRequest;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionStage;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Discussions")
class DiscussionController {

    private final DiscussionService service;
    private final UserDirectoryService userDirectory;

    @GetMapping("/submissions/{submissionId}/discussions")
    public List<DiscussionSummary> listForSubmission(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long submissionId,
            @RequestParam(value = "stage", required = false) SubmissionStage stage) {
        Long userId = resolveUserId(jwt);
        return service.listForSubmission(submissionId, stage, userId);
    }

    @PostMapping("/submissions/{submissionId}/discussions")
    public ResponseEntity<DiscussionSummary> open(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long submissionId,
            @Valid @RequestBody DiscussionOpenRequest body) {
        Long userId = resolveUserId(jwt);
        DiscussionSummary created = service.open(
                submissionId,
                body.stage(),
                body.subject(),
                body.firstMessage(),
                userId,
                body.participantUserIds());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/discussions/{id}/messages")
    public List<DiscussionMessageSummary> messages(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {
        return service.messagesOf(id, resolveUserId(jwt));
    }

    @PostMapping("/discussions/{id}/messages")
    public ResponseEntity<DiscussionMessageSummary> postMessage(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody DiscussionMessageRequest body) {
        DiscussionMessageSummary posted = service.postMessage(id, resolveUserId(jwt), body.body());
        return ResponseEntity.status(HttpStatus.CREATED).body(posted);
    }

    @PostMapping("/discussions/{id}/close")
    public ResponseEntity<Void> close(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {
        service.close(id, resolveUserId(jwt));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/discussions/{id}/participants")
    public ResponseEntity<Void> addParticipant(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody AddParticipantRequest body) {
        service.addParticipant(id, body.userId(), resolveUserId(jwt));
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/discussions/{id}/participants/{userId}")
    public ResponseEntity<Void> removeParticipant(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @PathVariable Long userId) {
        service.removeParticipant(id, userId, resolveUserId(jwt));
        return ResponseEntity.noContent().build();
    }

    private Long resolveUserId(Jwt jwt) {
        return userDirectory.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("authenticated user has no local profile"))
                .id();
    }
}
