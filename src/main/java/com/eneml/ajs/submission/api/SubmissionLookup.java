package com.eneml.ajs.submission.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface SubmissionLookup {

    Optional<SubmissionSummary> findById(Long submissionId);

    List<SubmissionAuthorSummary> authorsOf(Long submissionId);

    /**
     * Bibliographic metadata projection — title, abstract, keywords, locale.
     * Deliberately excludes author identity so the same record can be handed
     * to a reviewer in a double-anonymous round without leaking who wrote it.
     */
    Optional<SubmissionContent> findContent(Long submissionId);

    /**
     * Files attached to a submission, oldest first. Each entry exposes the
     * {@code storedFileId} so the caller can mint presigned download URLs
     * via storage::api.
     */
    List<SubmissionFileSummary> filesOf(Long submissionId);

    /**
     * Look up every contribution row that bears the given ORCID iD.
     * Multiple rows are possible if the person co-authored several
     * submissions; deduplication is the caller's responsibility.
     */
    List<SubmissionAuthorSummary> contributionsByOrcid(String orcidId);

    /** Submissions whose {@code dateSubmitted} is on or after {@code since}. */
    long countSubmittedSince(Instant since);

    /**
     * Submissions per month for {@code year}, keyed by month-of-year (1..12).
     * Months with no submissions are omitted; callers should fill in zeroes.
     */
    Map<Integer, Long> monthlySubmissionCounts(int year);
}
