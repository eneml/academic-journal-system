package com.eneml.ajs.editorial.internal.web;

import com.eneml.ajs.editorial.api.StageParticipantSummary;
import com.eneml.ajs.editorial.internal.application.StageAssignmentService;
import com.eneml.ajs.editorial.internal.web.dto.AssignParticipantRequest;
import com.eneml.ajs.editorial.internal.web.dto.UpdateParticipantRequest;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions/{submissionId}/participants")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','EDITOR','SECTION_EDITOR')")
@Tag(name = "Stage participants")
class StageParticipantController {

    private final StageAssignmentService service;
    private final UserDirectoryService users;

    @GetMapping
    public List<StageParticipantSummary> list(
            @PathVariable Long submissionId,
            @RequestParam(value = "stage", required = false) SubmissionStage stage) {
        return stage == null
                ? service.allParticipants(submissionId)
                : service.participantsAt(submissionId, stage);
    }

    @PostMapping
    public ResponseEntity<StageParticipantSummary> assign(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long submissionId,
            @Valid @RequestBody AssignParticipantRequest body) {
        UserSummary me = resolveMe(jwt);
        StageParticipantSummary created = service.assign(
                submissionId,
                body.stage(),
                body.userId(),
                body.role(),
                body.canChangeMetadata(),
                body.recommendOnly(),
                me.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{assignmentId}")
    public StageParticipantSummary update(
            @PathVariable Long submissionId,
            @PathVariable Long assignmentId,
            @Valid @RequestBody UpdateParticipantRequest body) {
        return service.update(submissionId, assignmentId, body.canChangeMetadata(), body.recommendOnly());
    }

    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Void> unassign(
            @PathVariable Long submissionId,
            @PathVariable Long assignmentId) {
        service.unassign(submissionId, assignmentId);
        return ResponseEntity.noContent().build();
    }

    private UserSummary resolveMe(Jwt jwt) {
        return users.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("authenticated user has no local profile"));
    }
}
