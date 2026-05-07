package com.eneml.ajs.search.internal.web;

import com.eneml.ajs.search.api.SearchHit;
import com.eneml.ajs.search.api.SearchQuery;
import com.eneml.ajs.search.api.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Tag(name = "Search")
class SearchController {

    private final SearchService service;

    @GetMapping
    @Operation(summary = "Full-text search across published works (public)")
    List<SearchHit> search(@RequestParam String q,
                           @RequestParam(required = false) Long section,
                           @RequestParam(required = false) Integer year,
                           @RequestParam(name = "type", required = false) List<String> types,
                           @RequestParam(name = "oa", required = false) Boolean openAccess,
                           @RequestParam(defaultValue = "0") int page,
                           @RequestParam(defaultValue = "20") int size) {
        return service.search(new SearchQuery(
                q, section, year,
                types == null ? List.of() : types,
                openAccess,
                page, size
        ));
    }
}
