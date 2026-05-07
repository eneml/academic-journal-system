package com.eneml.ajs.audit.internal.application;

import com.eneml.ajs.audit.api.AuditLookup;
import com.eneml.ajs.audit.api.EventLogEntrySummary;
import com.eneml.ajs.audit.internal.domain.EventLogEntry;
import com.eneml.ajs.audit.internal.persistence.EventLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class AuditLookupAdapter implements AuditLookup {

    private final EventLogRepository repository;

    @Override
    public List<EventLogEntrySummary> historyOf(Long submissionId) {
        return repository.findBySubmissionIdOrderByOccurredAtDesc(submissionId).stream()
                .map(this::toSummary)
                .toList();
    }

    @Override
    public long countForSubmission(Long submissionId) {
        return repository.countBySubmissionId(submissionId);
    }

    @Override
    public List<EventLogEntrySummary> recent(int limit) {
        int capped = Math.max(1, Math.min(limit, 500));
        return repository
                .findAllByOrderByOccurredAtDesc(PageRequest.of(0, capped))
                .stream()
                .map(this::toSummary)
                .toList();
    }

    private EventLogEntrySummary toSummary(EventLogEntry e) {
        return new EventLogEntrySummary(
                e.getId(),
                e.getEventType(),
                e.getSubmissionId(),
                e.getActorUserId(),
                e.getPayload(),
                e.getOccurredAt());
    }
}
