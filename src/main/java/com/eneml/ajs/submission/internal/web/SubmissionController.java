package com.eneml.ajs.submission.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.internal.application.SubmissionService;
import com.eneml.ajs.submission.internal.domain.Submission;
import com.eneml.ajs.submission.internal.web.dto.SubmissionDetailsRequest;
import com.eneml.ajs.submission.internal.web.dto.SubmissionResponse;
import com.eneml.ajs.submission.internal.web.dto.SubmissionStartRequest;
import com.eneml.ajs.submission.internal.web.mapper.SubmissionMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/submissions")
@RequiredArgsConstructor
@Tag(name = "Submissions")
class SubmissionController {

    private final SubmissionService service;
    private final SubmissionMapper mapper;
    private final UserDirectoryService userDirectory;

    @PostMapping
    @PreAuthorize("hasAnyRole('AUTHOR','EDITOR','ADMIN')")
    @Operation(summary = "Start a new draft submission")
    ResponseEntity<SubmissionResponse> start(@AuthenticationPrincipal Jwt jwt,
                                             @Valid @RequestBody SubmissionStartRequest request) {
        Long userId = currentUserId(jwt);
        Submission saved = service.start(request, userId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(saved.getId()).toUri();
        return ResponseEntity.created(location).body(mapper.toResponse(saved));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List my submissions (drafts + active workflow)")
    Page<SubmissionResponse> mine(@AuthenticationPrincipal Jwt jwt, Pageable pageable) {
        return service.listMine(currentUserId(jwt), pageable).map(mapper::toResponse);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Editorial queue — list submissions by status / stage")
    Page<SubmissionResponse> queue(@RequestParam(defaultValue = "QUEUED") SubmissionStatus status,
                                   @RequestParam(required = false) SubmissionStage stage,
                                   Pageable pageable) {
        return (stage == null
                ? service.listByStatus(status, pageable)
                : service.listEditorialQueue(stage, pageable)
        ).map(mapper::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get a submission")
    SubmissionResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Submission s = service.get(id);
        // Owner sees their own; editors and admins see anything else.
        boolean isOwner = s.getSubmittedByUserId().equals(currentUserId(jwt));
        boolean isEditor = jwt.getClaimAsStringList("realm_access.roles") != null
                || hasEditorialAuthority(jwt);
        if (!isOwner && !isEditor) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Not allowed to view submission " + id);
        }
        return mapper.toResponse(s);
    }

    @PutMapping("/{id}/details")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update draft details (title / abstract / keywords / wizard progress)")
    SubmissionResponse updateDetails(@AuthenticationPrincipal Jwt jwt,
                                     @PathVariable Long id,
                                     @Valid @RequestBody SubmissionDetailsRequest request) {
        return mapper.toResponse(service.updateDetails(id, request, currentUserId(jwt)));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Finalize draft and hand off to editorial workflow")
    SubmissionResponse submit(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return mapper.toResponse(service.submit(id, currentUserId(jwt)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete a draft submission (only DRAFT)")
    ResponseEntity<Void> deleteDraft(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.deleteDraft(id, currentUserId(jwt));
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId(Jwt jwt) {
        return userDirectory.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()))
                .id();
    }

    private static boolean hasEditorialAuthority(Jwt jwt) {
        var realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) return false;
        var roles = realmAccess.get("roles");
        if (!(roles instanceof java.util.Collection<?> coll)) return false;
        return coll.stream().anyMatch(r ->
                "EDITOR".equalsIgnoreCase(String.valueOf(r))
                        || "ADMIN".equalsIgnoreCase(String.valueOf(r))
                        || "SECTION_EDITOR".equalsIgnoreCase(String.valueOf(r)));
    }
}
