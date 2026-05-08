package com.eneml.ajs.highlight.internal.web;

import com.eneml.ajs.highlight.internal.application.HighlightService;
import com.eneml.ajs.highlight.internal.domain.Highlight;
import com.eneml.ajs.highlight.internal.web.dto.HighlightResponse;
import com.eneml.ajs.highlight.internal.web.dto.HighlightUpsertRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/highlights")
@RequiredArgsConstructor
@Tag(name = "Homepage highlights")
class HighlightController {

    private final HighlightService service;

    @GetMapping
    @Operation(summary = "List highlights — only enabled rows for anonymous callers")
    List<HighlightResponse> list(
            @org.springframework.web.bind.annotation.RequestParam(value = "all", required = false)
            Boolean all) {
        boolean returnAll = Boolean.TRUE.equals(all);
        List<Highlight> rows = returnAll ? service.listAll() : service.listEnabled();
        return rows.stream().map(this::toResponse).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a highlight")
    HighlightResponse create(@Valid @RequestBody HighlightUpsertRequest request) {
        return toResponse(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a highlight")
    HighlightResponse update(@PathVariable Long id,
                              @Valid @RequestBody HighlightUpsertRequest request) {
        return toResponse(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a highlight")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private HighlightResponse toResponse(Highlight h) {
        return new HighlightResponse(
                h.getId(),
                h.getSortOrder(),
                h.getTitle(),
                h.getDescription(),
                h.getUrl(),
                h.getImageStoredFileId(),
                service.resolveImageUrl(h),
                h.getTargetPublicationId(),
                service.resolveTargetUrlPath(h),
                h.isEnabled(),
                h.getVersion(),
                h.getUpdatedAt());
    }
}
