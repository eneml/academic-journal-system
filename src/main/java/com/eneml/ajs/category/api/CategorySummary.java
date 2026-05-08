package com.eneml.ajs.category.api;

import java.util.Map;

public record CategorySummary(
        Long id,
        Long parentId,
        String code,
        String path,
        double sequence,
        Map<String, String> title,
        Map<String, String> description,
        CategorySortOption sortOption,
        Long imageFileId) {
}
