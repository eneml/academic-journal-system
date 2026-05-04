package com.eneml.ajs.audit.internal.web;

import com.eneml.ajs.audit.api.AuditLookup;
import com.eneml.ajs.audit.api.EventLogEntrySummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions/{submissionId}/event-log")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
@Tag(name = "Audit log")
class AuditController {

    private final AuditLookup lookup;

    @GetMapping
    @Operation(summary = "Read the full event log for a submission")
    List<EventLogEntrySummary> history(@PathVariable Long submissionId) {
        return lookup.historyOf(submissionId);
    }
}
