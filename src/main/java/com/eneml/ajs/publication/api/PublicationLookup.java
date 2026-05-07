package com.eneml.ajs.publication.api;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PublicationLookup {

    Optional<PublicationSummary> findById(Long publicationId);

    Optional<PublicationSummary> findByUrlPath(String urlPath);

    List<PublicationSummary> versionsOf(Long submissionId);

    Optional<PublicationSummary> currentOf(Long submissionId);

    List<PublicationSummary> publishedInSection(Long sectionId, int limit);

    List<PublicationSummary> publishedInIssue(Long issueId);

    List<PublicationSummary> latestPublished(int limit);

    /** Publications whose status is PUBLISHED and date_published >= {@code since}. */
    long countPublishedSince(Instant since);
}
