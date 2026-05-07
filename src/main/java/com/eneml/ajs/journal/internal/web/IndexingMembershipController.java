package com.eneml.ajs.journal.internal.web;

import com.eneml.ajs.journal.internal.domain.IndexingMembership;
import com.eneml.ajs.journal.internal.persistence.IndexingMembershipRepository;
import com.eneml.ajs.journal.internal.web.dto.IndexingMembershipDto;
import com.eneml.ajs.shared.exception.NotFoundException;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
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
@RequestMapping("/api/v1/journal/indexing")
@RequiredArgsConstructor
@Tag(name = "Indexing memberships")
class IndexingMembershipController {

    private final IndexingMembershipRepository repository;

    @GetMapping
    List<IndexingMembershipDto> list(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "false")
            boolean includeInactive
    ) {
        var rows = includeInactive
                ? repository.findAllByOrderBySortOrderAscIdAsc()
                : repository.findAllByActiveTrueOrderBySortOrderAscIdAsc();
        return rows.stream().map(IndexingMembershipController::toDto).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    ResponseEntity<IndexingMembershipDto> create(@Valid @RequestBody IndexingMembershipDto body) {
        var entity = new IndexingMembership();
        applyDto(entity, body);
        repository.save(entity);
        return ResponseEntity.ok(toDto(entity));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    IndexingMembershipDto update(
            @PathVariable Long id,
            @Valid @RequestBody IndexingMembershipDto body
    ) {
        var entity = repository.findById(id)
                .orElseThrow(() -> NotFoundException.of("IndexingMembership", id));
        applyDto(entity, body);
        repository.save(entity);
        return toDto(entity);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static IndexingMembershipDto toDto(IndexingMembership e) {
        return new IndexingMembershipDto(
                e.getId(),
                e.getCode(),
                e.getLabel(),
                e.getUrl(),
                e.getQuartile(),
                e.getSortOrder(),
                e.isActive()
        );
    }

    private static void applyDto(IndexingMembership e, IndexingMembershipDto dto) {
        e.setCode(dto.code());
        e.setLabel(dto.label());
        e.setUrl(dto.url());
        e.setQuartile(dto.quartile());
        e.setSortOrder(dto.sortOrder());
        e.setActive(dto.active());
    }
}
