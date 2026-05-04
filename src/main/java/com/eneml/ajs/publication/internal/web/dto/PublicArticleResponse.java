package com.eneml.ajs.publication.internal.web.dto;

import com.eneml.ajs.publication.api.AccessStatus;
import com.eneml.ajs.publication.api.PublicationStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Response shape for the public article view. Distinct from
 * {@link PublicationResponse} so we can curate which fields ship to
 * unauthenticated readers (e.g. omit primaryAuthorEmail) and embed
 * supporting projections (authors, doi) the article page needs to
 * render proper SEO metadata and citation widgets.
 */
public record PublicArticleResponse(
        Long id,
        Long submissionId,
        int version,
        PublicationStatus status,
        AccessStatus accessStatus,
        Long sectionId,
        Long issueId,
        String urlPath,
        String licenseUrl,
        String copyrightHolder,
        Integer copyrightYear,
        String pages,
        Map<String, String> title,
        Map<String, String> abstractText,
        List<String> keywords,
        List<String> disciplines,
        String locale,
        Instant datePublished,
        String doi,
        List<PublicAuthorRef> authors
) {

    public record PublicAuthorRef(
            String givenName,
            String familyName,
            String orcidId,
            String affiliation,
            boolean corresponding
    ) {
    }
}
