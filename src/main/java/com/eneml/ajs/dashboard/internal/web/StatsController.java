package com.eneml.ajs.dashboard.internal.web;

import com.eneml.ajs.dashboard.api.DecisionBreakdown;
import com.eneml.ajs.dashboard.api.IssueStatsRow;
import com.eneml.ajs.dashboard.api.MonthlyFlowPoint;
import com.eneml.ajs.dashboard.api.PerformanceStats;
import com.eneml.ajs.dashboard.api.ReadingImpactSummary;
import com.eneml.ajs.dashboard.api.SectionStatsRow;
import com.eneml.ajs.dashboard.api.StatsOverview;
import com.eneml.ajs.dashboard.internal.application.StatsService;
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
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
@Tag(name = "Admin stats", description = "Journal-wide editorial KPIs")
class StatsController {

    private final StatsService service;

    @GetMapping("/overview")
    @Operation(summary = "YTD submissions, articles, acceptance rate, active reviewers")
    StatsOverview overview() {
        return service.overview();
    }

    @GetMapping("/monthly-flow")
    @Operation(summary = "Submissions and decisions, month by month, for a given year")
    List<MonthlyFlowPoint> monthlyFlow(
            @RequestParam(required = false) Integer year) {
        int y = year != null ? year : LocalDate.now().getYear();
        return service.monthlyFlow(y);
    }

    @GetMapping("/decisions")
    @Operation(summary = "Cumulative decision-type breakdown for the donut chart")
    List<DecisionBreakdown> decisions() {
        return service.decisionBreakdown();
    }

    @GetMapping("/sections")
    @Operation(summary = "Per-section submission counts + acceptance rate (current YTD)")
    List<SectionStatsRow> sections(@RequestParam(defaultValue = "en") String locale) {
        return service.sectionStats(locale);
    }

    @GetMapping("/performance")
    @Operation(summary = "Time-to-decision percentiles + histogram (current YTD)")
    PerformanceStats performance() {
        return service.performance();
    }

    @GetMapping("/reading-impact")
    @Operation(summary = "Cumulative abstract + file views and (placeholder) citations")
    ReadingImpactSummary readingImpact() {
        return service.readingImpact();
    }

    @GetMapping("/issues")
    @Operation(summary = "Per-issue article + view + download totals, newest first")
    List<IssueStatsRow> issues(@RequestParam(defaultValue = "12") int limit) {
        return service.issueStats(limit);
    }
}
