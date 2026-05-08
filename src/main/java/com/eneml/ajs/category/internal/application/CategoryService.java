package com.eneml.ajs.category.internal.application;

import com.eneml.ajs.category.api.CategorySortOption;
import com.eneml.ajs.category.api.CategorySummary;
import com.eneml.ajs.category.internal.domain.Category;
import com.eneml.ajs.category.internal.domain.PublicationCategory;
import com.eneml.ajs.category.internal.persistence.CategoryRepository;
import com.eneml.ajs.category.internal.persistence.PublicationCategoryRepository;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;
    private final PublicationCategoryRepository pcRepository;

    @Transactional(readOnly = true)
    public List<CategorySummary> listAll() {
        return repository.findAllOrdered().stream()
                .map(CategoryService::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategorySummary findById(Long id) {
        return repository.findById(id)
                .map(CategoryService::toSummary)
                .orElseThrow(() -> new NotFoundException("category not found: " + id));
    }

    @Transactional(readOnly = true)
    public CategorySummary findByPath(String path) {
        return repository.findByPath(path)
                .map(CategoryService::toSummary)
                .orElseThrow(() -> new NotFoundException("category not found: " + path));
    }

    @Transactional
    public CategorySummary create(String code,
                                   String path,
                                   Long parentId,
                                   Map<String, String> title,
                                   Map<String, String> description,
                                   CategorySortOption sortOption,
                                   Long imageFileId) {
        if (repository.findByCode(code).isPresent()) {
            throw new IllegalArgumentException("category code already in use: " + code);
        }
        if (repository.findByPath(path).isPresent()) {
            throw new IllegalArgumentException("category path already in use: " + path);
        }
        Category c = new Category();
        c.setCode(code);
        c.setPath(path);
        c.setParentId(parentId);
        c.setTitle(title == null ? new HashMap<>() : title);
        c.setDescription(description == null ? new HashMap<>() : description);
        c.setSortOption(sortOption == null
                ? CategorySortOption.DATE_PUBLISHED_DESC.dbValue()
                : sortOption.dbValue());
        c.setImageFileId(imageFileId);
        c.setSequence(nextSequenceForParent(parentId));
        return toSummary(repository.save(c));
    }

    @Transactional
    public CategorySummary update(Long id,
                                   Long parentId,
                                   String path,
                                   Map<String, String> title,
                                   Map<String, String> description,
                                   CategorySortOption sortOption,
                                   Long imageFileId) {
        Category c = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("category not found: " + id));
        if (path != null && !path.equals(c.getPath())) {
            if (repository.findByPath(path).filter(other -> !other.getId().equals(id)).isPresent()) {
                throw new IllegalArgumentException("category path already in use: " + path);
            }
            c.setPath(path);
        }
        c.setParentId(parentId);
        if (title != null) c.setTitle(title);
        if (description != null) c.setDescription(description);
        if (sortOption != null) c.setSortOption(sortOption.dbValue());
        c.setImageFileId(imageFileId);
        return toSummary(c);
    }

    @Transactional
    public void delete(Long id) {
        Category c = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("category not found: " + id));
        repository.delete(c);
    }

    @Transactional
    public void reorder(Long parentId, List<Long> orderedIds) {
        Map<Long, Category> byId = new HashMap<>();
        for (Category c : repository.findAllOrdered()) byId.put(c.getId(), c);
        for (int i = 0; i < orderedIds.size(); i++) {
            Category c = byId.get(orderedIds.get(i));
            if (c == null) {
                throw new NotFoundException("category not found: " + orderedIds.get(i));
            }
            c.setParentId(parentId);
            c.setSequence(i);
        }
    }

    /**
     * Replace the publication's category set with {@code categoryIds}. Empty
     * set wipes all bindings.
     */
    @Transactional
    public void setPublicationCategories(Long publicationId, Set<Long> categoryIds) {
        pcRepository.deleteByPublicationId(publicationId);
        for (Long cid : categoryIds) {
            // Skip ids that don't exist; the controller validates beforehand.
            if (repository.findById(cid).isEmpty()) continue;
            PublicationCategory link = new PublicationCategory();
            link.setPublicationId(publicationId);
            link.setCategoryId(cid);
            pcRepository.save(link);
        }
    }

    @Transactional(readOnly = true)
    public List<Long> categoryIdsOfPublication(Long publicationId) {
        return pcRepository.findByPublicationId(publicationId).stream()
                .map(PublicationCategory::getCategoryId)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Long> publicationIdsInCategory(Long categoryId) {
        return pcRepository.findByCategoryId(categoryId).stream()
                .map(PublicationCategory::getPublicationId)
                .toList();
    }

    private double nextSequenceForParent(Long parentId) {
        double max = 0;
        for (Category c : repository.findAllOrdered()) {
            if (java.util.Objects.equals(c.getParentId(), parentId) && c.getSequence() > max) {
                max = c.getSequence();
            }
        }
        return max + 1;
    }

    static CategorySummary toSummary(Category c) {
        return new CategorySummary(
                c.getId(),
                c.getParentId(),
                c.getCode(),
                c.getPath(),
                c.getSequence(),
                c.getTitle(),
                c.getDescription(),
                CategorySortOption.ofDbValue(c.getSortOption()),
                c.getImageFileId());
    }
}
