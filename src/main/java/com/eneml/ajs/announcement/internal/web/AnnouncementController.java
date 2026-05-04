package com.eneml.ajs.announcement.internal.web;

import com.eneml.ajs.announcement.internal.application.AnnouncementService;
import com.eneml.ajs.announcement.internal.domain.Announcement;
import com.eneml.ajs.announcement.internal.web.dto.AnnouncementResponse;
import com.eneml.ajs.announcement.internal.web.dto.AnnouncementUpsertRequest;
import com.eneml.ajs.announcement.internal.web.mapper.AnnouncementMapper;
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
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
@Tag(name = "Announcements")
class AnnouncementController {

    private final AnnouncementService service;

    @GetMapping
    @Operation(summary = "List currently visible announcements (public)")
    List<AnnouncementResponse> list(@RequestParam(defaultValue = "20") int limit) {
        return AnnouncementMapper.toResponses(service.listVisible(Instant.now(), limit));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "List all announcements (admin)")
    List<AnnouncementResponse> listAll() {
        return AnnouncementMapper.toResponses(service.listAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single announcement by id (public)")
    AnnouncementResponse get(@PathVariable Long id) {
        return AnnouncementMapper.toResponse(service.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Post an announcement")
    ResponseEntity<AnnouncementResponse> create(@Valid @RequestBody AnnouncementUpsertRequest request) {
        Announcement saved = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(saved.getId()).toUri();
        return ResponseEntity.created(location).body(AnnouncementMapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Update an announcement")
    AnnouncementResponse update(@PathVariable Long id,
                                @Valid @RequestBody AnnouncementUpsertRequest request) {
        return AnnouncementMapper.toResponse(service.update(id, request));
    }

    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Hide an announcement without deleting it")
    AnnouncementResponse withdraw(@PathVariable Long id) {
        return AnnouncementMapper.toResponse(service.setVisible(id, false));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Permanently delete an announcement")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
