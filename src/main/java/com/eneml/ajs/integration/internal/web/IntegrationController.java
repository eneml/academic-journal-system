package com.eneml.ajs.integration.internal.web;

import com.eneml.ajs.integration.api.DepositSubject;
import com.eneml.ajs.integration.api.DepositSummary;
import com.eneml.ajs.integration.api.DepositTarget;
import com.eneml.ajs.integration.internal.application.CrossRefDepositXmlGenerator;
import com.eneml.ajs.integration.internal.application.DepositService;
import com.eneml.ajs.integration.internal.application.JatsGenerator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/integration")
@RequiredArgsConstructor
@Tag(name = "Integration")
class IntegrationController {

    private final JatsGenerator jatsGenerator;
    private final CrossRefDepositXmlGenerator crossRefGenerator;
    private final DepositService depositService;

    @GetMapping(value = "/publications/{publicationId}/jats",
                produces = MediaType.APPLICATION_XML_VALUE)
    @PreAuthorize("hasAnyRole('EDITOR','PRODUCTION_STAFF','ADMIN')")
    @Operation(summary = "Generate the JATS XML rendition of a publication")
    ResponseEntity<String> jatsXml(@PathVariable Long publicationId) {
        String xml = jatsGenerator.generate(publicationId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(xml);
    }

    @GetMapping(value = "/publications/{publicationId}/crossref",
                produces = MediaType.APPLICATION_XML_VALUE)
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Preview the CrossRef deposit XML for a publication")
    ResponseEntity<String> crossrefXml(@PathVariable Long publicationId) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(crossRefGenerator.generate(publicationId));
    }

    @GetMapping("/publications/{publicationId}/deposits")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "List all outbound deposit attempts for a publication")
    List<DepositSummary> deposits(@PathVariable Long publicationId) {
        return depositService.historyFor(DepositSubject.PUBLICATION, publicationId);
    }

    @PostMapping("/publications/{publicationId}/deposits/{target}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Manually enqueue a deposit attempt to CrossRef or ORCID")
    DepositSummary enqueue(@PathVariable Long publicationId, @PathVariable DepositTarget target) {
        var record = depositService.enqueue(target, DepositSubject.PUBLICATION, publicationId);
        return new DepositSummary(
                record.getId(),
                record.getTarget(),
                record.getSubjectType(),
                record.getSubjectId(),
                record.getExternalRef(),
                record.getStatus(),
                record.getAttempts(),
                record.getLastAttemptAt(),
                record.getCompletedAt(),
                record.getErrorMessage());
    }
}
