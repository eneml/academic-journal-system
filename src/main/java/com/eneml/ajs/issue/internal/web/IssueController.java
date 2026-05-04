package com.eneml.ajs.issue.internal.web;

import com.eneml.ajs.issue.internal.application.IssuePdfService;
import com.eneml.ajs.issue.internal.application.IssueService;
import com.eneml.ajs.issue.internal.domain.Issue;
import com.eneml.ajs.issue.internal.web.dto.IssueResponse;
import com.eneml.ajs.issue.internal.web.dto.IssueUpsertRequest;
import com.eneml.ajs.issue.internal.web.mapper.IssueMapper;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.shared.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/issues")
@RequiredArgsConstructor
@Tag(name = "Issues")
class IssueController {

    private final IssueService service;
    private final IssueMapper mapper;
    private final PublicationLookup publicationLookup;
    private final IssuePdfService issuePdfService;

    @GetMapping
    @Operation(summary = "List all issues")
    List<IssueResponse> list() {
        return mapper.toResponses(service.listAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an issue by id")
    IssueResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.get(id));
    }

    @GetMapping("/by-path/{urlPath}")
    @Operation(summary = "Get a published issue by its url-path slug (public)")
    IssueResponse getByPath(@PathVariable String urlPath) {
        Issue issue = Optional.ofNullable(urlPath)
                .filter(p -> !p.isBlank())
                .flatMap(service::findByUrlPath)
                .filter(Issue::isPublished)
                .orElseThrow(() -> NotFoundException.of("Issue", urlPath));
        return mapper.toResponse(issue);
    }

    @GetMapping("/{id}/publications")
    @Operation(summary = "List the published articles in an issue (public TOC)")
    List<PublicationSummary> tableOfContents(@PathVariable Long id) {
        return publicationLookup.publishedInIssue(id);
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
        return new ResponseEntity<>(result.pdf(), headers, org.springframework.http.HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Create an issue")
    ResponseEntity<IssueResponse> create(@Valid @RequestBody IssueUpsertRequest request) {
        Issue saved = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(saved.getId()).toUri();
        return ResponseEntity.created(location).body(mapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Update an issue")
    IssueResponse update(@PathVariable Long id, @Valid @RequestBody IssueUpsertRequest request) {
        return mapper.toResponse(service.update(id, request));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Publish an issue")
    IssueResponse publish(@PathVariable Long id) {
        return mapper.toResponse(service.publish(id));
    }

    @PostMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Unpublish an issue")
    IssueResponse unpublish(@PathVariable Long id) {
        return mapper.toResponse(service.unpublish(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Delete an unpublished issue")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
