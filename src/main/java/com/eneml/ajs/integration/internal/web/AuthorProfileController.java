package com.eneml.ajs.integration.internal.web;

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
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Public author profile — given an ORCID iD, returns the person's name +
 * the published works they've contributed to in this journal.
 *
 * <p>Lives in the integration module so the publication module doesn't
 * need to know about submission's author rows. Both lookups already
 * resolve through the modulith APIs.
 */
@RestController
@RequestMapping("/api/v1/authors")
@RequiredArgsConstructor
@Tag(name = "Author profiles")
class AuthorProfileController {

    private final SubmissionLookup submissionLookup;
    private final PublicationLookup publicationLookup;

    @GetMapping("/{orcid}")
    @Operation(summary = "Public profile for an author identified by ORCID iD")
    AuthorProfile profile(@PathVariable String orcid) {
        List<SubmissionAuthorSummary> contributions = submissionLookup.contributionsByOrcid(orcid);
        if (contributions.isEmpty()) {
            throw NotFoundException.of("Author", orcid);
        }
        // Pick the most "recent" (highest id) contribution row for the
        // canonical name + affiliation — author records can drift over time
        // and the freshest is most likely accurate.
        SubmissionAuthorSummary latest = contributions.stream()
                .max(Comparator.comparing(SubmissionAuthorSummary::id))
                .orElseThrow();

        // Walk each unique submission, keep only the latest PUBLISHED version.
        Map<Long, PublicationSummary> bySubmission = new LinkedHashMap<>();
        contributions.stream()
                .map(SubmissionAuthorSummary::submissionId)
                .distinct()
                .forEach(sid -> publicationLookup.versionsOf(sid).stream()
                        .filter(p -> p.status() == PublicationStatus.PUBLISHED)
                        .max(Comparator.comparingInt(PublicationSummary::version))
                        .ifPresent(p -> bySubmission.put(sid, p)));

        List<PublicationSummary> works = bySubmission.values().stream()
                .sorted(Comparator.comparing(
                        PublicationSummary::datePublished,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        return new AuthorProfile(
                normalize(orcid),
                latest.givenName(),
                latest.familyName(),
                latest.affiliation(),
                works.size(),
                works);
    }

    private static String normalize(String raw) {
        if (raw == null) return "";
        String trimmed = raw.trim();
        return trimmed.startsWith("http") ? trimmed : ("https://orcid.org/" + trimmed);
    }

    public record AuthorProfile(
            String orcidUrl,
            String givenName,
            String familyName,
            String affiliation,
            int worksCount,
            List<PublicationSummary> works
    ) {
    }
}
