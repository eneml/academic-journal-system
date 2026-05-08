package com.eneml.ajs.publication.internal.web;

import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationStatus;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionAuthorSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * "Read next" recommendations served on the public article reading
 * page. by-author finds other published works by any of the current
 * paper's authors (matched by ORCID); the result excludes the article
 * the reader is currently on.
 */
@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
@Tag(name = "Article recommendations")
class RecommendationsController {

    private final PublicationLookup publicationLookup;
    private final SubmissionLookup submissionLookup;

    @GetMapping("/{slugOrId}/recommendations/by-author")
    @Operation(summary = "Other published articles by any of this article's authors (public)")
    public List<PublicationSummary> byAuthor(
            @PathVariable String slugOrId,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        PublicationSummary current = resolve(slugOrId);
        List<SubmissionAuthorSummary> authors = submissionLookup.authorsOf(current.submissionId());
        Set<Long> seen = new LinkedHashSet<>();
        List<PublicationSummary> results = new java.util.ArrayList<>();
        for (SubmissionAuthorSummary a : authors) {
            String orcid = a.orcidId();
            if (orcid == null || orcid.isBlank()) continue;
            for (SubmissionAuthorSummary peer : submissionLookup.contributionsByOrcid(orcid)) {
                if (peer.submissionId().equals(current.submissionId())) continue;
                publicationLookup.currentOf(peer.submissionId()).ifPresent(p -> {
                    if (p.status() == PublicationStatus.PUBLISHED && seen.add(p.id())) {
                        results.add(p);
                    }
                });
                if (results.size() >= Math.max(1, limit)) break;
            }
            if (results.size() >= Math.max(1, limit)) break;
        }
        return results;
    }

    private PublicationSummary resolve(String slugOrId) {
        return publicationLookup.findByUrlPath(slugOrId)
                .or(() -> tryNumeric(slugOrId).flatMap(publicationLookup::findById))
                .filter(p -> p.status() == PublicationStatus.PUBLISHED)
                .orElseThrow(() -> NotFoundException.of("Article", slugOrId));
    }

    private static java.util.Optional<Long> tryNumeric(String s) {
        try {
            return java.util.Optional.of(Long.parseLong(s));
        } catch (NumberFormatException e) {
            return java.util.Optional.empty();
        }
    }
}
