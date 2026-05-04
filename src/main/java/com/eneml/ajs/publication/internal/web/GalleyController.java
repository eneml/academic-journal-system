package com.eneml.ajs.publication.internal.web;

import com.eneml.ajs.publication.internal.application.DoiService;
import com.eneml.ajs.publication.internal.application.GalleyService;
import com.eneml.ajs.publication.internal.web.dto.AssignDoiRequest;
import com.eneml.ajs.publication.internal.web.dto.GalleyResponse;
import com.eneml.ajs.publication.internal.web.dto.GalleyUpsertRequest;
import com.eneml.ajs.publication.internal.web.mapper.GalleyMapper;
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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/publications/{publicationId}/galleys")
@RequiredArgsConstructor
@Tag(name = "Galleys")
class GalleyController {

    private final GalleyService galleyService;
    private final DoiService doiService;
    private final GalleyMapper mapper;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List galleys for a publication")
    List<GalleyResponse> list(@PathVariable Long publicationId) {
        return mapper.toResponses(galleyService.listForPublication(publicationId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EDITOR','PRODUCTION_STAFF','ADMIN')")
    @Operation(summary = "Add a galley (PDF/HTML/JATS) to the publication")
    ResponseEntity<GalleyResponse> add(@PathVariable Long publicationId,
                                        @Valid @RequestBody GalleyUpsertRequest request) {
        var saved = galleyService.add(publicationId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(saved.getId()).toUri();
        return ResponseEntity.created(location).body(mapper.toResponse(saved));
    }

    @PutMapping("/{galleyId}")
    @PreAuthorize("hasAnyRole('EDITOR','PRODUCTION_STAFF','ADMIN')")
    @Operation(summary = "Update a galley's metadata")
    GalleyResponse update(@PathVariable Long publicationId,
                           @PathVariable Long galleyId,
                           @Valid @RequestBody GalleyUpsertRequest request) {
        return mapper.toResponse(galleyService.update(publicationId, galleyId, request));
    }

    @PostMapping("/{galleyId}/approve")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Approve a galley for public display")
    GalleyResponse approve(@PathVariable Long publicationId, @PathVariable Long galleyId) {
        return mapper.toResponse(galleyService.approve(publicationId, galleyId));
    }

    @PostMapping("/{galleyId}/unapprove")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Withdraw a galley from public display")
    GalleyResponse unapprove(@PathVariable Long publicationId, @PathVariable Long galleyId) {
        return mapper.toResponse(galleyService.unapprove(publicationId, galleyId));
    }

    @DeleteMapping("/{galleyId}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Remove a galley")
    ResponseEntity<Void> remove(@PathVariable Long publicationId, @PathVariable Long galleyId) {
        galleyService.remove(publicationId, galleyId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{galleyId}/doi")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Assign a DOI to a galley")
    GalleyResponse assignDoi(@PathVariable Long publicationId,
                              @PathVariable Long galleyId,
                              @Valid @RequestBody AssignDoiRequest request) {
        doiService.assignToGalley(galleyId, request.doi());
        return mapper.toResponse(galleyService.get(galleyId));
    }
}
