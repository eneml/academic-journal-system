package com.eneml.ajs.publication.internal.web;

import com.eneml.ajs.publication.internal.application.PublicationService;
import com.eneml.ajs.publication.internal.web.dto.PublicationResponse;
import com.eneml.ajs.publication.internal.web.dto.PublicationUpsertRequest;
import com.eneml.ajs.publication.internal.web.mapper.PublicationMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Publications")
class PublicationController {

    private final PublicationService service;
    private final PublicationMapper mapper;
    private final com.eneml.ajs.publication.api.PublicationLookup lookup;

    @GetMapping("/publications/recent")
    @Operation(summary = "Most recently published publications (public)")
    java.util.List<com.eneml.ajs.publication.api.PublicationSummary> recent(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "12") int limit) {
        return lookup.latestPublished(limit);
    }

    @GetMapping("/submissions/{submissionId}/publications")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List all versions of a submission's publication")
    List<PublicationResponse> versions(@PathVariable Long submissionId) {
        return mapper.toResponses(service.versionsOf(submissionId));
    }

    @PostMapping("/submissions/{submissionId}/publications")
    @PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
    @Operation(summary = "Create the first publication draft from an accepted submission")
    PublicationResponse draftFirst(@PathVariable Long submissionId) {
        return mapper.toResponse(service.draftFirstVersion(submissionId));
    }

    @PostMapping("/publications/{publicationId}/versions")
    @PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
    @Operation(summary = "Create the next version (clone) of a published publication")
    PublicationResponse createNextVersion(@PathVariable Long publicationId) {
        return mapper.toResponse(service.createNextVersion(publicationId));
    }

    @GetMapping("/publications/{publicationId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get a publication by id")
    PublicationResponse get(@PathVariable Long publicationId) {
        return mapper.toResponse(service.get(publicationId));
    }

    @PutMapping("/publications/{publicationId}")
    @PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN','PRODUCTION_STAFF')")
    @Operation(summary = "Update a draft publication's metadata")
    PublicationResponse update(@PathVariable Long publicationId,
                                @Valid @RequestBody PublicationUpsertRequest request) {
        return mapper.toResponse(service.update(publicationId, request));
    }

    @PostMapping("/publications/{publicationId}/publish")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Publish a draft publication")
    PublicationResponse publish(@PathVariable Long publicationId) {
        return mapper.toResponse(service.publish(publicationId));
    }

    @PostMapping("/publications/{publicationId}/unpublish")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Unpublish a published publication (becomes hidden)")
    ResponseEntity<PublicationResponse> unpublish(@PathVariable Long publicationId) {
        return ResponseEntity.ok(mapper.toResponse(service.unpublish(publicationId)));
    }
}
