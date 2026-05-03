package com.eneml.ajs.journal.internal.web;

import com.eneml.ajs.journal.internal.application.MastheadService;
import com.eneml.ajs.journal.internal.domain.MastheadEntry;
import com.eneml.ajs.journal.internal.web.dto.MastheadEntryResponse;
import com.eneml.ajs.journal.internal.web.dto.MastheadEntryUpsertRequest;
import com.eneml.ajs.journal.internal.web.dto.ReorderRequest;
import com.eneml.ajs.journal.internal.web.mapper.MastheadMapper;
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
@RequestMapping("/api/v1/journal/masthead")
@RequiredArgsConstructor
@Tag(name = "Masthead", description = "Editorial board listing displayed on the public site")
class MastheadController {

    private final MastheadService service;
    private final MastheadMapper mapper;

    @GetMapping
    @Operation(summary = "List masthead entries (public)")
    List<MastheadEntryResponse> list(@RequestParam(defaultValue = "true") boolean visibleOnly) {
        return mapper.toResponses(service.list(visibleOnly));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get masthead entry by id (public)")
    MastheadEntryResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add an entry to the masthead")
    ResponseEntity<MastheadEntryResponse> add(@Valid @RequestBody MastheadEntryUpsertRequest request) {
        MastheadEntry saved = service.add(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(saved.getId()).toUri();
        return ResponseEntity.created(location).body(mapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a masthead entry")
    MastheadEntryResponse update(@PathVariable Long id,
                                 @Valid @RequestBody MastheadEntryUpsertRequest request) {
        return mapper.toResponse(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove an entry from the masthead")
    ResponseEntity<Void> remove(@PathVariable Long id) {
        service.remove(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reorder masthead entries")
    ResponseEntity<Void> reorder(@Valid @RequestBody ReorderRequest request) {
        service.reorder(request.orderedIds());
        return ResponseEntity.noContent().build();
    }
}
