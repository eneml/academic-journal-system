package com.eneml.ajs.submission.api;

import java.time.Instant;
import java.util.Map;

public record SubmissionSummary(
        Long id,
        Long sectionId,
        SubmissionStage stage,
        SubmissionStatus status,
        SubmissionProgress progress,
        String locale,
        Long submittedByUserId,
        Map<String, String> title,
        Instant dateSubmitted,
        Instant dateLastActivity
) {
}
