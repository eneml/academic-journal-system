package com.eneml.ajs.audit.api;

import java.util.List;

public interface AuditLookup {

    List<EventLogEntrySummary> historyOf(Long submissionId);

    long countForSubmission(Long submissionId);

    /** Most-recent journal-wide events, newest first. Capped at {@code limit}. */
    List<EventLogEntrySummary> recent(int limit);
}
