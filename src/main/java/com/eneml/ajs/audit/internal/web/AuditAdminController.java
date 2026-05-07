package com.eneml.ajs.audit.internal.web;

import com.eneml.ajs.audit.api.AuditLookup;
import com.eneml.ajs.audit.api.EventLogEntrySummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/audit-log")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
@Tag(name = "Admin audit log", description = "Journal-wide event stream")
class AuditAdminController {

    private final AuditLookup lookup;

    @GetMapping
    @Operation(summary = "Most recent journal-wide events, newest first")
    List<EventLogEntrySummary> recent(
            @RequestParam(defaultValue = "100") int limit) {
        return lookup.recent(limit);
    }
}
