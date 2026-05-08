package com.eneml.ajs.submission.internal.web.dto;

import com.eneml.ajs.submission.api.SubmissionProgress;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record SubmissionResponse(
        Long id,
        Long sectionId,
        SubmissionStage stage,
        SubmissionStatus status,
        SubmissionProgress progress,
        String locale,
        Long submittedByUserId,
        String commentsToEditor,
        Map<String, String> title,
        Map<String, String> abstractText,
        List<String> keywords,
        List<String> disciplines,
        Map<String, String> subjects,
        List<String> languages,
        Map<String, String> dataAvailability,
        String referencesRaw,
        Instant dateSubmitted,
        Instant dateLastActivity,
        long version,
        Instant updatedAt
) {
}
