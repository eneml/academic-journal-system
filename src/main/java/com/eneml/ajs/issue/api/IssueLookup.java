package com.eneml.ajs.issue.api;

import java.util.List;
import java.util.Optional;

public interface IssueLookup {

    Optional<IssueSummary> findById(Long issueId);

    Optional<IssueSummary> findByUrlPath(String urlPath);

    Optional<IssueSummary> findCurrent();

    List<IssueSummary> listPublished(int limit);
}
