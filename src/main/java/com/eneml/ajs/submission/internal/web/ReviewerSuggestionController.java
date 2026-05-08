package com.eneml.ajs.submission.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.ReviewerSuggestionSummary;
import com.eneml.ajs.submission.internal.application.ReviewerSuggestionService;
import com.eneml.ajs.submission.internal.web.dto.ReviewerSuggestionUpsertRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions/{submissionId}/reviewer-suggestions")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Reviewer suggestions")
class ReviewerSuggestionController {

    private final ReviewerSuggestionService service;
    private final UserDirectoryService userDirectory;

    @GetMapping
    public List<ReviewerSuggestionSummary> list(@PathVariable Long submissionId) {
        return service.listFor(submissionId);
    }

    @PostMapping
    public ResponseEntity<ReviewerSuggestionSummary> add(
            @PathVariable Long submissionId,
            @Valid @RequestBody ReviewerSuggestionUpsertRequest body) {
        ReviewerSuggestionSummary created = service.add(
                submissionId,
                body.givenName(),
                body.familyName(),
                body.email(),
                body.orcidId(),
                body.affiliation(),
                body.suggestionReason(),
                null);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{suggestionId}")
    public ReviewerSuggestionSummary update(
            @PathVariable Long submissionId,
            @PathVariable Long suggestionId,
            @Valid @RequestBody ReviewerSuggestionUpsertRequest body) {
        return service.update(submissionId, suggestionId,
                body.givenName(), body.familyName(), body.email(),
                body.orcidId(), body.affiliation(), body.suggestionReason());
    }

    @PostMapping("/{suggestionId}/approve")
    @PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
    public ReviewerSuggestionSummary approve(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long submissionId,
            @PathVariable Long suggestionId) {
        Long approver = userDirectory.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("authenticated user has no local profile"))
                .id();
        return service.approve(submissionId, suggestionId, approver);
    }

    @DeleteMapping("/{suggestionId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long submissionId,
            @PathVariable Long suggestionId) {
        service.delete(submissionId, suggestionId);
        return ResponseEntity.noContent().build();
    }
}
