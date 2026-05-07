package com.eneml.ajs.issue.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.issue.internal.application.IssuePdfService;
import com.eneml.ajs.issue.internal.application.IssueService;
import com.eneml.ajs.issue.internal.domain.Issue;
import com.eneml.ajs.issue.internal.web.dto.IssueResponse;
import com.eneml.ajs.issue.internal.web.dto.IssueUpsertRequest;
import com.eneml.ajs.issue.internal.web.mapper.IssueMapper;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationOrderService;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.storage.api.FileStorageService;
import com.eneml.ajs.storage.api.FileUploadRequest;
import com.eneml.ajs.storage.api.StoredFileRef;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/issues")
@RequiredArgsConstructor
@Tag(name = "Issues")
class IssueController {

    /**
     * TTL for the cover-image presigned URL embedded in {@link IssueResponse}.
     * Short enough to be safe (a leaked URL expires quickly) but long enough
     * that an editor session won't tear out an image mid-edit.
     */
    private static final Duration COVER_URL_TTL = Duration.ofHours(1);

    /**
     * Browsers will rewrite the public cover URL through their cache for
     * this long. Cover images rarely change after publication, so a long
     * cache lifetime cuts down on the round-trips through our backend.
     */
    private static final Duration COVER_PUBLIC_CACHE = Duration.ofMinutes(10);

    /**
     * Hard cap on cover image file size. 5 MiB is comfortably more than a
     * 2000×3000 JPEG cover and well under MinIO/R2 buffering limits.
     */
    private static final long MAX_COVER_BYTES = 5L * 1024 * 1024;

    private static final Set<String> ACCEPTED_COVER_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif");

    private final IssueService service;
    private final IssueMapper mapper;
    private final PublicationLookup publicationLookup;
    private final PublicationOrderService publicationOrder;
    private final IssuePdfService issuePdfService;
    private final FileStorageService fileStorage;
    private final UserDirectoryService userDirectory;

    @GetMapping
    @Operation(summary = "List all issues")
    List<IssueResponse> list() {
        return service.listAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an issue by id")
    IssueResponse get(@PathVariable Long id) {
        return toResponse(service.get(id));
    }

    @GetMapping("/by-path/{urlPath}")
    @Operation(summary = "Get a published issue by its url-path slug (public)")
    IssueResponse getByPath(@PathVariable String urlPath) {
        Issue issue = Optional.ofNullable(urlPath)
                .filter(p -> !p.isBlank())
                .flatMap(service::findByUrlPath)
                .filter(Issue::isPublished)
                .orElseThrow(() -> NotFoundException.of("Issue", urlPath));
        return toResponse(issue);
    }

    @GetMapping("/{id}/publications")
    @Operation(summary = "List the published articles in an issue (public TOC)")
    List<PublicationSummary> tableOfContents(@PathVariable Long id) {
        return publicationLookup.publishedInIssue(id);
    }

    @PatchMapping("/{id}/articles")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR','SECTION_EDITOR','PRODUCTION_STAFF')")
    @Operation(summary = "Reorder articles in an issue (drag-drop curation)")
    ResponseEntity<Void> reorderArticles(
            @PathVariable Long id,
            @Valid @RequestBody com.eneml.ajs.issue.internal.web.dto.IssueArticleOrderRequest body
    ) {
        publicationOrder.reorderInIssue(id, body.order());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/articles/{publicationId}/section")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR','SECTION_EDITOR','PRODUCTION_STAFF')")
    @Operation(summary = "Move an article between sections within the same issue")
    ResponseEntity<Void> moveArticleToSection(
            @PathVariable Long id,
            @PathVariable Long publicationId,
            @Valid @RequestBody com.eneml.ajs.issue.internal.web.dto.IssueArticleSectionRequest body
    ) {
        publicationOrder.moveToSection(publicationId, body.sectionId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Combined-issue PDF — every article's approved PDF galley merged in TOC order (public)")
    ResponseEntity<byte[]> issuePdf(@PathVariable Long id) {
        IssuePdfService.IssuePdfResult result = issuePdfService.build(id);
        if (result.isEmpty()) {
            // Either no articles in the issue, or no approved PDF galleys yet.
            // Surface as 404 rather than ship a 0-byte download.
            throw NotFoundException.of("IssuePdf", id);
        }
        Issue issue = result.issue();
        String filename = "issue-" + Optional.ofNullable(issue.getUrlPath())
                .filter(s -> !s.isBlank())
                .orElseGet(() -> String.valueOf(issue.getId())) + ".pdf";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(org.springframework.http.ContentDisposition
                .attachment().filename(filename).build());
        // Issues are immutable once published — let CDNs cache aggressively.
        headers.setCacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic());
        return new ResponseEntity<>(result.pdf(), headers, HttpStatus.OK);
    }

    /**
     * Public cover redirect. We hand back a 302 to a freshly-minted
     * presigned URL so the binary itself never goes through Spring (and
     * cover URLs stay stable for embed sources). Anonymous reads are
     * allowed because the issues that surface here are the published
     * ones; unpublished issues 404 to avoid leaking covers ahead of release.
     */
    @GetMapping("/{id}/cover")
    @Operation(summary = "Redirect to the issue's cover image (public)")
    ResponseEntity<Void> coverRedirect(@PathVariable Long id) {
        Issue issue = service.get(id);
        if (issue.getCoverFileId() == null) {
            throw NotFoundException.of("IssueCover", id);
        }
        URI presigned = fileStorage.downloadUrl(issue.getCoverFileId(), COVER_URL_TTL);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(presigned);
        headers.setCacheControl(CacheControl.maxAge(COVER_PUBLIC_CACHE).cachePublic());
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Create an issue")
    ResponseEntity<IssueResponse> create(@Valid @RequestBody IssueUpsertRequest request) {
        Issue saved = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(saved.getId()).toUri();
        return ResponseEntity.created(location).body(toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Update an issue")
    IssueResponse update(@PathVariable Long id, @Valid @RequestBody IssueUpsertRequest request) {
        return toResponse(service.update(id, request));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Publish an issue")
    IssueResponse publish(@PathVariable Long id) {
        return toResponse(service.publish(id));
    }

    @PostMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Unpublish an issue")
    IssueResponse unpublish(@PathVariable Long id) {
        return toResponse(service.unpublish(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Delete an unpublished issue")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Upload (or replace) an issue's cover image. Accepts a multipart
     * payload with field {@code file}. The previous cover, if any, is
     * soft-deleted by {@link IssueService#setCoverFile}.
     */
    @PostMapping(value = "/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Upload or replace the issue's cover image")
    IssueResponse uploadCover(@AuthenticationPrincipal Jwt jwt,
                               @PathVariable Long id,
                               @RequestParam("file") MultipartFile file) throws IOException {
        // Validate up front so we don't waste an S3 round-trip on a 50 MiB
        // payload or a `text/csv`.
        if (file.isEmpty()) {
            throw new ConflictException("Cover file is empty");
        }
        if (file.getSize() > MAX_COVER_BYTES) {
            throw new ConflictException(
                    "Cover image too large (max %d bytes)".formatted(MAX_COVER_BYTES));
        }
        String contentType = file.getContentType();
        if (contentType == null || !ACCEPTED_COVER_TYPES.contains(contentType.toLowerCase())) {
            throw new ConflictException(
                    "Unsupported cover content-type: " + contentType
                            + " (allowed: " + ACCEPTED_COVER_TYPES + ")");
        }

        Long userId = userDirectory.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()))
                .id();

        StoredFileRef ref = fileStorage.store(new FileUploadRequest(
                file.getInputStream(),
                contentType,
                file.getOriginalFilename(),
                userId));

        Issue updated = service.setCoverFile(id, ref.id());
        return toResponse(updated);
    }

    @DeleteMapping("/{id}/cover")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Remove the issue's cover image")
    IssueResponse removeCover(@PathVariable Long id) {
        return toResponse(service.clearCoverFile(id));
    }

    /**
     * Build the wire DTO with cover URL resolved. We keep this in the
     * controller (instead of the mapper) because the URL needs a live
     * presigned URL — that's an I/O call that doesn't belong in MapStruct.
     */
    private IssueResponse toResponse(Issue entity) {
        IssueResponse base = mapper.toResponse(entity);
        String coverUrl = resolveCoverUrl(entity);
        return new IssueResponse(
                base.id(),
                base.volume(),
                base.number(),
                base.year(),
                base.title(),
                base.description(),
                base.coverImagePath(),
                coverUrl,
                entity.getCoverFileId(),
                base.urlPath(),
                base.showVolume(),
                base.showNumber(),
                base.showYear(),
                base.showTitle(),
                base.published(),
                base.datePublished(),
                base.accessStatus(),
                base.openAccessDate(),
                base.version(),
                base.updatedAt());
    }

    private String resolveCoverUrl(Issue issue) {
        if (issue.getCoverFileId() != null) {
            return fileStorage.downloadUrl(issue.getCoverFileId(), COVER_URL_TTL).toString();
        }
        // Legacy free-form URL stored before this feature shipped.
        if (issue.getCoverImagePath() != null && !issue.getCoverImagePath().isBlank()) {
            return issue.getCoverImagePath();
        }
        return null;
    }
}
