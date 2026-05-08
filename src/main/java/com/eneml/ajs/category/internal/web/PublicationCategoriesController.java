package com.eneml.ajs.category.internal.web;

import com.eneml.ajs.category.api.CategorySummary;
import com.eneml.ajs.category.internal.application.CategoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/publications/{publicationId}/categories")
@RequiredArgsConstructor
@Tag(name = "Publication ↔ category bindings")
class PublicationCategoriesController {

    private final CategoryService service;

    /** Public read so the article reading page can render the badge list. */
    @GetMapping
    public List<CategorySummary> list(@PathVariable Long publicationId) {
        return service.categoryIdsOfPublication(publicationId).stream()
                .map(service::findById)
                .toList();
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
    public List<CategorySummary> set(@PathVariable Long publicationId,
                                      @Valid @RequestBody SetRequest body) {
        Set<Long> ids = body.categoryIds() == null
                ? Set.of()
                : new HashSet<>(body.categoryIds());
        service.setPublicationCategories(publicationId, ids);
        return list(publicationId);
    }

    public record SetRequest(@NotNull List<Long> categoryIds) {}
}
