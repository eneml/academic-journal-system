package com.eneml.ajs.journal.internal.web;

import com.eneml.ajs.journal.internal.application.SectionService;
import com.eneml.ajs.journal.internal.domain.Section;
import com.eneml.ajs.journal.internal.web.dto.ReorderRequest;
import com.eneml.ajs.journal.internal.web.dto.SectionCreateRequest;
import com.eneml.ajs.journal.internal.web.dto.SectionResponse;
import com.eneml.ajs.journal.internal.web.dto.SectionUpdateRequest;
import com.eneml.ajs.journal.internal.web.mapper.SectionMapper;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/journal/sections")
@RequiredArgsConstructor
@Tag(name = "Sections", description = "Editorial sections (Articles, Reviews, Editorials, ...)")
class SectionController {

    private final SectionService service;
    private final SectionMapper mapper;

    @GetMapping
    @Operation(summary = "List sections (public)")
    List<SectionResponse> list(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return mapper.toResponses(service.list(includeInactive));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get section by id (public)")
    SectionResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a section")
    ResponseEntity<SectionResponse> create(@Valid @RequestBody SectionCreateRequest request) {
        Section saved = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(saved.getId()).toUri();
        return ResponseEntity.created(location).body(mapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a section (code is immutable)")
    SectionResponse update(@PathVariable Long id,
                           @Valid @RequestBody SectionUpdateRequest request) {
        return mapper.toResponse(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Soft-deactivate a section (kept for historical references)")
    SectionResponse deactivate(@PathVariable Long id) {
        return mapper.toResponse(service.deactivate(id));
    }

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reactivate a previously deactivated section")
    SectionResponse reactivate(@PathVariable Long id) {
        return mapper.toResponse(service.reactivate(id));
    }

    @PostMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reorder sections (assigns seq = 10, 20, 30, ...)")
    ResponseEntity<Void> reorder(@Valid @RequestBody ReorderRequest request) {
        service.reorder(request.orderedIds());
        return ResponseEntity.noContent().build();
    }
}
