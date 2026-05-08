package com.eneml.ajs.category.internal.application;

import com.eneml.ajs.category.api.CategoryLookup;
import com.eneml.ajs.category.api.CategorySummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class CategoryLookupAdapter implements CategoryLookup {

    private final CategoryService service;

    @Override
    public List<CategorySummary> listAll() {
        return service.listAll();
    }

    @Override
    public Optional<CategorySummary> findById(Long id) {
        try {
            return Optional.of(service.findById(id));
        } catch (RuntimeException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<CategorySummary> findByPath(String path) {
        try {
            return Optional.of(service.findByPath(path));
        } catch (RuntimeException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<CategorySummary> categoriesOfPublication(Long publicationId) {
        List<Long> ids = service.categoryIdsOfPublication(publicationId);
        return ids.stream()
                .map(service::findById)
                .toList();
    }

    @Override
    public List<Long> publicationsInCategory(Long categoryId) {
        return service.publicationIdsInCategory(categoryId);
    }
}
