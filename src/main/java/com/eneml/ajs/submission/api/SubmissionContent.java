package com.eneml.ajs.submission.api;

import java.util.List;
import java.util.Map;

/**
 * Read-only projection of a submission's <em>content</em> — the
 * bibliographic metadata reviewers and editors need to evaluate the
 * manuscript. Excludes everything author-identifying so the same record
 * can be safely handed to a reviewer in a double-anonymous round.
 *
 * @param submissionId  parent submission's database id
 * @param locale        primary language of the manuscript (BCP-47)
 * @param title         localized titles keyed by language tag
 * @param abstractText  localized abstracts keyed by language tag
 * @param keywords      free-text keywords as entered by the author
 */
public record SubmissionContent(
        Long submissionId,
        String locale,
        Map<String, String> title,
        Map<String, String> abstractText,
        List<String> keywords
) {
}
