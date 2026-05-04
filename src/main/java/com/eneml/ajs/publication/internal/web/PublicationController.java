package com.eneml.ajs.publication.internal.web;

import com.eneml.ajs.publication.api.DoiLookup;
import com.eneml.ajs.publication.internal.application.PublicationService;
import com.eneml.ajs.publication.internal.domain.Publication;
import com.eneml.ajs.publication.internal.web.dto.PublicArticleResponse;
import com.eneml.ajs.publication.internal.web.dto.PublicationResponse;
import com.eneml.ajs.publication.internal.web.dto.PublicationUpsertRequest;
import com.eneml.ajs.publication.internal.web.mapper.PublicationMapper;
import com.eneml.ajs.submission.api.SubmissionLookup;
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
    private final SubmissionLookup submissionLookup;
    private final DoiLookup doiLookup;

    @GetMapping("/publications/recent")
    @Operation(summary = "Most recently published publications (public)")
    java.util.List<com.eneml.ajs.publication.api.PublicationSummary> recent(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "12") int limit) {
        return lookup.latestPublished(limit);
    }

    @GetMapping("/articles/{slugOrId}")
    @Operation(summary = "Public article view by url-path slug or numeric id (PUBLISHED only)")
    PublicArticleResponse articleBySlugOrId(@PathVariable String slugOrId) {
        var byPath = lookup.findByUrlPath(slugOrId);
        var summary = byPath.orElseGet(() -> tryNumeric(slugOrId)
                .flatMap(lookup::findById)
                .orElse(null));
        if (summary == null
                || summary.status() != com.eneml.ajs.publication.api.PublicationStatus.PUBLISHED) {
            throw com.eneml.ajs.shared.exception.NotFoundException.of("Article", slugOrId);
        }
        Publication entity = service.get(summary.id());
        String doi = entity.getDoiId() == null ? null
                : doiLookup.findById(entity.getDoiId()).map(d -> d.doi()).orElse(null);
        var authors = submissionLookup.authorsOf(entity.getSubmissionId()).stream()
                .map(a -> new PublicArticleResponse.PublicAuthorRef(
                        a.givenName(),
                        a.familyName(),
                        a.orcidId(),
                        a.affiliation(),
                        a.corresponding()))
                .toList();
        return new PublicArticleResponse(
                entity.getId(),
                entity.getSubmissionId(),
                entity.getVersionNumber(),
                entity.getStatus(),
                entity.getAccessStatus(),
                entity.getSectionId(),
                entity.getIssueId(),
                entity.getUrlPath(),
                entity.getLicenseUrl(),
                entity.getCopyrightHolder(),
                entity.getCopyrightYear(),
                entity.getPages(),
                entity.getTitle(),
                entity.getAbstractText(),
                entity.getKeywords(),
                entity.getDisciplines(),
                entity.getLocale(),
                entity.getDatePublished(),
                doi,
                authors);
    }

    private static java.util.Optional<Long> tryNumeric(String s) {
        try { return java.util.Optional.of(Long.parseLong(s)); }
        catch (NumberFormatException e) { return java.util.Optional.empty(); }
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
