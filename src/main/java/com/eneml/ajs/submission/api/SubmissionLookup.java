package com.eneml.ajs.submission.api;

import java.util.List;
import java.util.Optional;

public interface SubmissionLookup {

    Optional<SubmissionSummary> findById(Long submissionId);

    List<SubmissionAuthorSummary> authorsOf(Long submissionId);

    /**
     * Look up every contribution row that bears the given ORCID iD.
     * Multiple rows are possible if the person co-authored several
     * submissions; deduplication is the caller's responsibility.
     */
    List<SubmissionAuthorSummary> contributionsByOrcid(String orcidId);
}
