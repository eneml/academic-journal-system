package com.eneml.ajs.integration.internal.web;

import com.eneml.ajs.integration.internal.application.CitationFormatter;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationStatus;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.shared.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * Public citation endpoint. Lives in the integration module rather than
 * the publication module to avoid a dependency cycle: the citation
 * formatter pulls issue + journal lookups, and the issue module already
 * depends on publication::api.
 */
@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
@Tag(name = "Article citations")
class ArticleCitationController {

    private final PublicationLookup publicationLookup;
    private final CitationFormatter citationFormatter;

    @GetMapping(value = "/{slugOrId}/citation", produces = "text/plain")
    @Operation(summary = "Citation for a published article in BibTeX / RIS / APA format (public)")
    ResponseEntity<String> citation(
            @PathVariable String slugOrId,
            @RequestParam(defaultValue = "BIBTEX") CitationFormatter.Format format) {
        PublicationSummary summary = publicationLookup.findByUrlPath(slugOrId)
                .or(() -> tryNumeric(slugOrId).flatMap(publicationLookup::findById))
                .orElseThrow(() -> NotFoundException.of("Article", slugOrId));
        if (summary.status() != PublicationStatus.PUBLISHED) {
            throw NotFoundException.of("Article", slugOrId);
        }
        String body = citationFormatter.format(summary, format);
        String filename = (summary.urlPath() != null
                ? summary.urlPath()
                : String.valueOf(summary.id())) + "." + extensionFor(format);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                .body(body);
    }

    private static String extensionFor(CitationFormatter.Format f) {
        return switch (f) {
            case BIBTEX -> "bib";
            case RIS    -> "ris";
            case APA    -> "txt";
        };
    }

    private static Optional<Long> tryNumeric(String s) {
        try {
            return Optional.of(Long.parseLong(s));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}
