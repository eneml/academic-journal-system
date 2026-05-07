package com.eneml.ajs.library.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.library.internal.domain.UserLibraryItem;
import com.eneml.ajs.library.internal.persistence.UserLibraryRepository;
import com.eneml.ajs.library.internal.web.dto.LibraryItemRequest;
import com.eneml.ajs.library.internal.web.dto.LibraryItemResponse;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.shared.exception.NotFoundException;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/library")
@RequiredArgsConstructor
@Tag(name = "User library")
@PreAuthorize("isAuthenticated()")
class LibraryController {

    private final UserLibraryRepository repository;
    private final PublicationLookup publicationLookup;
    private final UserDirectoryService userDirectory;

    @GetMapping
    LibraryListResponse list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Long userId = currentUserId(jwt);
        Page<UserLibraryItem> rows = repository.findByUserIdOrderBySavedAtDesc(
                userId, PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)))
        );
        return new LibraryListResponse(
                rows.getContent().stream().map(LibraryController::toResponse).toList(),
                rows.getTotalElements()
        );
    }

    @PostMapping
    @Transactional
    ResponseEntity<LibraryItemResponse> save(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody LibraryItemRequest body
    ) {
        Long userId = currentUserId(jwt);
        if (publicationLookup.findById(body.publicationId()).isEmpty()) {
            throw NotFoundException.of("Publication", body.publicationId());
        }
        var existing = repository.findByUserIdAndPublicationId(userId, body.publicationId());
        UserLibraryItem item = existing.orElseGet(UserLibraryItem::new);
        item.setUserId(userId);
        item.setPublicationId(body.publicationId());
        item.setNote(body.note());
        repository.save(item);
        return ResponseEntity.ok(toResponse(item));
    }

    @DeleteMapping("/{publicationId}")
    @Transactional
    ResponseEntity<Void> remove(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long publicationId
    ) {
        Long userId = currentUserId(jwt);
        repository.deleteByUserIdAndPublicationId(userId, publicationId);
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId(Jwt jwt) {
        return userDirectory.findByKeycloakSub(jwt.getSubject())
                .map(com.eneml.ajs.identity.api.UserSummary::id)
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()));
    }

    private static LibraryItemResponse toResponse(UserLibraryItem e) {
        return new LibraryItemResponse(
                e.getId(),
                e.getPublicationId(),
                e.getSavedAt(),
                e.getNote()
        );
    }

    /** Page-style envelope for the GET endpoint. */
    public record LibraryListResponse(
            java.util.List<LibraryItemResponse> items,
            long total
    ) {
    }
}
