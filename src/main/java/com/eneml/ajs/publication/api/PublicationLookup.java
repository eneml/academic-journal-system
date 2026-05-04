package com.eneml.ajs.publication.api;

import java.util.List;
import java.util.Optional;

public interface PublicationLookup {

    Optional<PublicationSummary> findById(Long publicationId);

    Optional<PublicationSummary> findByUrlPath(String urlPath);

    List<PublicationSummary> versionsOf(Long submissionId);

    Optional<PublicationSummary> currentOf(Long submissionId);

    List<PublicationSummary> publishedInSection(Long sectionId, int limit);

    List<PublicationSummary> latestPublished(int limit);
}
