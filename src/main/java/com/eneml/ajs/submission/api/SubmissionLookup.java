package com.eneml.ajs.submission.api;

import java.util.List;
import java.util.Optional;

public interface SubmissionLookup {

    Optional<SubmissionSummary> findById(Long submissionId);

    List<SubmissionAuthorSummary> authorsOf(Long submissionId);
}
