package com.eneml.ajs.publication.internal.web;

import com.eneml.ajs.metrics.api.MetricsRecorder;
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
    private final MetricsRecorder metricsRecorder;

    @GetMapping("/publications/recent")
    @Operation(summary = "Most recently published publications (public)")
    java.util.List<com.eneml.ajs.publication.api.PublicationSummary> recent(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "12") int limit) {
        return lookup.latestPublished(limit);
    }

    @GetMapping("/sections/{sectionId}/publications")
    @Operation(summary = "Recent published articles in a given section (public)")
    java.util.List<com.eneml.ajs.publication.api.PublicationSummary> publicationsInSection(
            @PathVariable Long sectionId,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "30") int limit) {
        return lookup.publishedInSection(sectionId, limit);
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
        // Record the page view *before* loading the heavy entity — even if the
        // counter call has its own (REQUIRES_NEW) tx, doing it first means a
        // slow counter doesn't delay the user-visible response. The metrics
        // service swallows its own failures.
        metricsRecorder.recordView(summary.id());
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

    @GetMapping("/articles/{slugOrId}/galleys")
    @Operation(summary = "List approved galleys for a published article (public)")
    java.util.List<com.eneml.ajs.publication.api.GalleySummary> articleGalleys(
            @PathVariable String slugOrId,
            @org.springframework.beans.factory.annotation.Autowired
            com.eneml.ajs.publication.api.GalleyLookup galleyLookup) {
        var summary = lookup.findByUrlPath(slugOrId)
                .or(() -> tryNumeric(slugOrId).flatMap(lookup::findById))
                .orElse(null);
        if (summary == null
                || summary.status() != com.eneml.ajs.publication.api.PublicationStatus.PUBLISHED) {
            throw com.eneml.ajs.shared.exception.NotFoundException.of("Article", slugOrId);
        }
        return galleyLookup.approvedGalleysOfPublication(summary.id());
    }

    @GetMapping("/articles/{slugOrId}/galleys/{galleyId}/download-url")
    @Operation(summary = "Get a short-lived presigned URL for a galley's underlying file (public for OPEN articles)")
    java.util.Map<String, String> articleGalleyDownloadUrl(
            @PathVariable String slugOrId,
            @PathVariable Long galleyId,
            @org.springframework.beans.factory.annotation.Autowired
            com.eneml.ajs.publication.api.GalleyLookup galleyLookup,
            @org.springframework.beans.factory.annotation.Autowired
            com.eneml.ajs.storage.api.FileStorageService fileStorage) {
        var summary = lookup.findByUrlPath(slugOrId)
                .or(() -> tryNumeric(slugOrId).flatMap(lookup::findById))
                .orElse(null);
        if (summary == null
                || summary.status() != com.eneml.ajs.publication.api.PublicationStatus.PUBLISHED
                || summary.accessStatus() != com.eneml.ajs.publication.api.AccessStatus.OPEN) {
            throw com.eneml.ajs.shared.exception.NotFoundException.of("Article", slugOrId);
        }
        var galley = galleyLookup.findById(galleyId)
                .filter(g -> summary.id().equals(g.publicationId()))
                .filter(com.eneml.ajs.publication.api.GalleySummary::approved)
                .orElseThrow(() -> com.eneml.ajs.shared.exception.NotFoundException.of("Galley", galleyId));
        // Count the download as soon as we've resolved a real galley file —
        // we want the counter even if the storage layer hiccups during URL
        // generation, since the user clicked download. Metrics service is
        // best-effort and swallows its own errors.
        metricsRecorder.recordDownload(summary.id(), galleyId);
        if (galley.remoteUrl() != null && !galley.remoteUrl().isBlank()) {
            return java.util.Map.of("url", galley.remoteUrl());
        }
        if (galley.submissionFileId() == null) {
            throw com.eneml.ajs.shared.exception.NotFoundException.of("GalleyFile", galleyId);
        }
        java.net.URI uri = fileStorage.downloadUrl(galley.submissionFileId(),
                java.time.Duration.ofMinutes(15));
        return java.util.Map.of("url", uri.toString());
    }

    @GetMapping("/articles/{slugOrId}/versions")
    @Operation(summary = "List all PUBLISHED versions of an article (public)")
    List<com.eneml.ajs.publication.api.PublicationSummary> articleVersions(
            @PathVariable String slugOrId) {
        var summary = lookup.findByUrlPath(slugOrId)
                .or(() -> tryNumeric(slugOrId).flatMap(lookup::findById))
                .orElse(null);
        if (summary == null
                || summary.status() != com.eneml.ajs.publication.api.PublicationStatus.PUBLISHED) {
            throw com.eneml.ajs.shared.exception.NotFoundException.of("Article", slugOrId);
        }
        // Only published versions visible to the public; drafts and unpublished
        // ones never leak through this endpoint.
        return lookup.versionsOf(summary.submissionId()).stream()
                .filter(p -> p.status() == com.eneml.ajs.publication.api.PublicationStatus.PUBLISHED)
                .toList();
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

    @PostMapping("/publications/{publicationId}/schedule")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Schedule a draft to auto-publish at a future instant")
    PublicationResponse schedule(@PathVariable Long publicationId,
                                  @org.springframework.web.bind.annotation.RequestParam
                                  java.time.Instant when) {
        return mapper.toResponse(service.schedule(publicationId, when));
    }

    @PostMapping("/publications/{publicationId}/unpublish")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Unpublish a published publication (becomes hidden)")
    ResponseEntity<PublicationResponse> unpublish(@PathVariable Long publicationId) {
        return ResponseEntity.ok(mapper.toResponse(service.unpublish(publicationId)));
    }
}
