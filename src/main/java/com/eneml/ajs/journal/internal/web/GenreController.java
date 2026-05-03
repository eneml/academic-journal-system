package com.eneml.ajs.journal.internal.web;

import com.eneml.ajs.journal.internal.application.GenreService;
import com.eneml.ajs.journal.internal.domain.Genre;
import com.eneml.ajs.journal.internal.web.dto.GenreCreateRequest;
import com.eneml.ajs.journal.internal.web.dto.GenreResponse;
import com.eneml.ajs.journal.internal.web.dto.GenreUpdateRequest;
import com.eneml.ajs.journal.internal.web.dto.ReorderRequest;
import com.eneml.ajs.journal.internal.web.mapper.GenreMapper;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/journal/genres")
@RequiredArgsConstructor
@Tag(name = "Genres", description = "File-type taxonomy (Article Text, Image, Data Set, ...)")
class GenreController {

    private final GenreService service;
    private final GenreMapper mapper;

    @GetMapping
    @Operation(summary = "List genres (public)")
    List<GenreResponse> list(@RequestParam(defaultValue = "false") boolean enabledOnly) {
        return mapper.toResponses(service.list(enabledOnly));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get genre by id (public)")
    GenreResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a genre")
    ResponseEntity<GenreResponse> create(@Valid @RequestBody GenreCreateRequest request) {
        Genre saved = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(saved.getId()).toUri();
        return ResponseEntity.created(location).body(mapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a genre (code is immutable; use enable/disable for state)")
    GenreResponse update(@PathVariable Long id,
                         @Valid @RequestBody GenreUpdateRequest request) {
        return mapper.toResponse(service.update(id, request));
    }

    @PostMapping("/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Enable a genre")
    GenreResponse enable(@PathVariable Long id) {
        return mapper.toResponse(service.setEnabled(id, true));
    }

    @PostMapping("/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Disable a genre (existing files retain it; new uploads cannot use it)")
    GenreResponse disable(@PathVariable Long id) {
        return mapper.toResponse(service.setEnabled(id, false));
    }

    @PostMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reorder genres")
    ResponseEntity<Void> reorder(@Valid @RequestBody ReorderRequest request) {
        service.reorder(request.orderedIds());
        return ResponseEntity.noContent().build();
    }
}
