package com.eneml.ajs.search.api;

public record SearchQuery(
        String text,
        Long sectionId,
        Integer year,
        int page,
        int size
) {

    public SearchQuery {
        if (page < 0) page = 0;
        if (size <= 0 || size > 100) size = 20;
    }
}
