package com.eneml.ajs.audit.api;

import java.util.List;

public interface AuditLookup {

    List<EventLogEntrySummary> historyOf(Long submissionId);

    long countForSubmission(Long submissionId);
}
