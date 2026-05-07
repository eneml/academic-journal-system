package com.eneml.ajs.dashboard.internal.web;

import com.eneml.ajs.dashboard.api.ArticleStatsPage;
import com.eneml.ajs.dashboard.internal.application.ArticleStatsService;
import com.eneml.ajs.metrics.api.DailyMetricsBucket;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/stats/articles")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
@Tag(name = "Admin article stats")
class ArticleStatsController {

    private final ArticleStatsService service;

    @GetMapping("/timeseries")
    @Operation(summary = "Daily or monthly time-series of abstract + file views over a range")
    List<DailyMetricsBucket> timeseries(
            @RequestParam LocalDate from,
            @RequestParam LocalDate to,
            @RequestParam(defaultValue = "daily") String granularity) {
        boolean monthly = "monthly".equalsIgnoreCase(granularity);
        return service.timeseries(from, to, monthly);
    }

    @GetMapping("/details")
    @Operation(summary = "Paged per-article totals for the inspected range")
    ArticleStatsPage details(
            @RequestParam LocalDate from,
            @RequestParam LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "en") String locale,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @RequestParam(defaultValue = "total") String sort,
            @RequestParam(defaultValue = "desc") String dir) {
        return service.articles(from, to, q, locale, page, size, sort, dir);
    }
}
