package com.eneml.ajs.publication.internal.web;

import com.eneml.ajs.publication.api.DoiStatus;
import com.eneml.ajs.publication.internal.domain.Doi;
import com.eneml.ajs.publication.internal.persistence.DoiRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

/**
 * Admin-side DOI dashboard. Lists every DOI with its current status and
 * exposes a {@code /redeposit} action that flips a row back to
 * NOT_REGISTERED so the existing deposit dispatcher will re-attempt it
 * on the next tick.
 */
@RestController
@RequestMapping("/api/v1/admin/dois")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
@Tag(name = "DOI manager")
class DoiAdminController {

    private final DoiRepository repository;

    @GetMapping
    @Operation(summary = "List DOIs, optionally filtered by status")
    List<DoiAdminRow> list(@RequestParam(value = "status", required = false) DoiStatus status) {
        List<Doi> rows = (status == null)
                ? repository.findAll()
                : repository.findByStatus(status);
        return rows.stream().map(DoiAdminController::toRow).toList();
    }

    @PostMapping("/{id}/redeposit")
    @Operation(summary = "Mark a DOI for re-deposit on the next dispatch tick")
    @Transactional
    DoiAdminRow redeposit(@PathVariable Long id) {
        Doi d = repository.findById(id).orElseThrow();
        d.setStatus(DoiStatus.NOT_REGISTERED);
        d.setErrorMessage(null);
        return toRow(d);
    }

    @PostMapping("/{id}/mark-stale")
    @Operation(summary = "Manually flag a DOI as STALE")
    @Transactional
    DoiAdminRow markStale(@PathVariable Long id) {
        Doi d = repository.findById(id).orElseThrow();
        d.markStale();
        return toRow(d);
    }

    private static DoiAdminRow toRow(Doi d) {
        return new DoiAdminRow(d.getId(), d.getDoi(), d.getStatus(),
                d.getRegisteredAt(), d.getErrorMessage(), d.getUpdatedAt());
    }

    public record DoiAdminRow(
            Long id,
            String doi,
            DoiStatus status,
            Instant registeredAt,
            String errorMessage,
            Instant updatedAt
    ) {}
}
