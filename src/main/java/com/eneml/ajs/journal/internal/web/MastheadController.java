package com.eneml.ajs.journal.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/journal/masthead")
@RequiredArgsConstructor
@Tag(name = "Masthead", description = "Editorial board listing displayed on the public site")
class MastheadController {

    private final MastheadService service;
    private final MastheadMapper mapper;
    private final UserDirectoryService userDirectory;

    @GetMapping
    @Operation(summary = "List masthead entries (public, enriched with author info)")
    List<MastheadEntryResponse> list(@RequestParam(defaultValue = "true") boolean visibleOnly) {
        var entries = service.list(visibleOnly);
        var users = userDirectory.findByIds(
                entries.stream().map(MastheadEntry::getUserId).toList());
        return entries.stream().map(e -> enrich(mapper.toResponse(e), users)).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get masthead entry by id (public)")
    MastheadEntryResponse get(@PathVariable Long id) {
        var entry = service.get(id);
        var users = userDirectory.findByIds(List.of(entry.getUserId()));
        return enrich(mapper.toResponse(entry), users);
    }

    private static MastheadEntryResponse enrich(
            MastheadEntryResponse base, Map<Long, UserSummary> users) {
        UserSummary u = users.get(base.userId());
        if (u == null) return base;
        return new MastheadEntryResponse(
                base.id(),
                base.userId(),
                base.roleLabel(),
                base.bioOverride(),
                base.displayOrder(),
                base.visible(),
                base.version(),
                base.updatedAt(),
                u.givenName(),
                u.familyName(),
                u.orcidId());
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
