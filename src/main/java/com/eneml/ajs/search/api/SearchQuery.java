package com.eneml.ajs.search.api;

import java.util.List;

public record SearchQuery(
        String text,
        Long sectionId,
        Integer year,
        List<String> articleTypes,
        Boolean openAccess,
        int page,
        int size
) {

    public SearchQuery {
        if (page < 0) page = 0;
        if (size <= 0 || size > 100) size = 20;
        if (articleTypes == null) articleTypes = List.of();
    }

    public SearchQuery(String text, Long sectionId, Integer year, int page, int size) {
        this(text, sectionId, year, List.of(), null, page, size);
    }
}
