package com.eneml.ajs.category.internal.web;

import com.eneml.ajs.category.api.CategorySummary;
import com.eneml.ajs.category.internal.application.CategoryService;
import com.eneml.ajs.category.internal.web.dto.CategoryReorderRequest;
import com.eneml.ajs.category.internal.web.dto.CategoryUpsertRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories")
class CategoryController {

    private final CategoryService service;

    /** Public: anyone can list categories — they drive public-site navigation. */
    @GetMapping
    public List<CategorySummary> list() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    public CategorySummary one(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/by-path/{path}")
    public CategorySummary byPath(@PathVariable String path) {
        return service.findByPath(path);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategorySummary> create(@Valid @RequestBody CategoryUpsertRequest body) {
        CategorySummary created = service.create(
                body.code(),
                body.path(),
                body.parentId(),
                body.title(),
                body.description(),
                body.sortOption(),
                body.imageFileId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategorySummary update(@PathVariable Long id,
                                   @Valid @RequestBody CategoryUpsertRequest body) {
        return service.update(id,
                body.parentId(),
                body.path(),
                body.title(),
                body.description(),
                body.sortOption(),
                body.imageFileId());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reorder(@Valid @RequestBody CategoryReorderRequest body) {
        service.reorder(body.parentId(), body.orderedIds());
        return ResponseEntity.noContent().build();
    }
}
