package com.eneml.ajs.journal.internal.web;

import com.eneml.ajs.journal.internal.application.JournalConfigService;
import com.eneml.ajs.journal.internal.web.dto.JournalConfigResponse;
import com.eneml.ajs.journal.internal.web.dto.JournalConfigUpdateRequest;
import com.eneml.ajs.journal.internal.web.mapper.JournalConfigMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/journal/config")
@RequiredArgsConstructor
@Tag(name = "Journal config", description = "Singleton journal-wide configuration")
class JournalController {

    private final JournalConfigService service;
    private final JournalConfigMapper mapper;

    @GetMapping
    @Operation(summary = "Get journal configuration (public)")
    JournalConfigResponse get() {
        return mapper.toResponse(service.get());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update journal configuration")
    JournalConfigResponse update(@Valid @RequestBody JournalConfigUpdateRequest request) {
        return mapper.toResponse(service.update(request));
    }
}
