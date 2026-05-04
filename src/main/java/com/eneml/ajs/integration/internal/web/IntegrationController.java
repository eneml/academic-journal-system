package com.eneml.ajs.integration.internal.web;

import com.eneml.ajs.integration.internal.application.JatsGenerator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/integration")
@RequiredArgsConstructor
@Tag(name = "Integration")
class IntegrationController {

    private final JatsGenerator jatsGenerator;

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
}
