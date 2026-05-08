package com.eneml.ajs.category.api;

import java.util.List;
import java.util.Optional;

public interface CategoryLookup {

    /** All categories ordered by parent_id then sequence. Cheap; cached upstream. */
    List<CategorySummary> listAll();

    Optional<CategorySummary> findById(Long id);

    Optional<CategorySummary> findByPath(String path);

    /** Categories a publication is in. */
    List<CategorySummary> categoriesOfPublication(Long publicationId);

    /** Publication ids in a category, ordered by the category's sortOption. */
    List<Long> publicationsInCategory(Long categoryId);
}
