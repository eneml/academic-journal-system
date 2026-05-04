package com.eneml.ajs.audit.internal.application;

import com.eneml.ajs.audit.internal.domain.EventLogEntry;
import com.eneml.ajs.audit.internal.persistence.EventLogRepository;
import com.eneml.ajs.editorial.api.DecisionMade;
import com.eneml.ajs.issue.api.IssuePublished;
import com.eneml.ajs.issue.api.IssueUnpublished;
import com.eneml.ajs.publication.api.PublicationPublished;
import com.eneml.ajs.publication.api.PublicationUnpublished;
import com.eneml.ajs.publication.api.PublicationVersioned;
import com.eneml.ajs.review.api.ReviewSubmitted;
import com.eneml.ajs.review.api.ReviewerAccepted;
import com.eneml.ajs.review.api.ReviewerDeclined;
import com.eneml.ajs.review.api.ReviewerInvited;
import com.eneml.ajs.submission.api.SubmissionStageChanged;
import com.eneml.ajs.submission.api.SubmissionSubmitted;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Single omnibus listener that captures every domain event the audit
 * trail cares about. Each {@code @ApplicationModuleListener} runs after
 * the originating transaction commits, so the event log is durably
 * recorded without blocking the producer.
 */
@Component
@RequiredArgsConstructor
class AuditEventRecorder {

    private final EventLogRepository repository;

    // ---------- submission ----------

    @ApplicationModuleListener
    void on(SubmissionSubmitted event) {
        record("submission.submitted", event.submissionId(), event.submittedByUserId(),
                event.occurredAt(),
                Map.of("sectionId", event.sectionId()));
    }

    @ApplicationModuleListener
    void on(SubmissionStageChanged event) {
        record("submission.stage-changed", event.submissionId(), null, event.occurredAt(),
                Map.of("previousStage", event.previousStage().name(),
                        "newStage", event.newStage().name(),
                        "newStatus", event.newStatus().name()));
    }

    // ---------- review ----------

    @ApplicationModuleListener
    void on(ReviewerInvited event) {
        record("review.reviewer-invited", event.submissionId(), null, event.occurredAt(),
                payload("assignmentId", event.assignmentId(),
                        "roundId", event.roundId(),
                        "reviewerUserId", event.reviewerUserId(),
                        "method", event.reviewMethod().name()));
    }

    @ApplicationModuleListener
    void on(ReviewerAccepted event) {
        record("review.reviewer-accepted", event.submissionId(), null, event.occurredAt(),
                Map.of("assignmentId", event.assignmentId()));
    }

    @ApplicationModuleListener
    void on(ReviewerDeclined event) {
        record("review.reviewer-declined", event.submissionId(), null, event.occurredAt(),
                payload("assignmentId", event.assignmentId(),
                        "reason", event.reason()));
    }

    @ApplicationModuleListener
    void on(ReviewSubmitted event) {
        record("review.submitted", event.submissionId(), event.reviewerUserId(), event.occurredAt(),
                payload("assignmentId", event.assignmentId(),
                        "recommendation", event.recommendation() == null
                                ? null : event.recommendation().name()));
    }

    // ---------- editorial ----------

    @ApplicationModuleListener
    void on(DecisionMade event) {
        record("editorial.decision", event.submissionId(), event.decidedByUserId(),
                event.occurredAt(),
                payload("decisionId", event.decisionId(),
                        "type", event.type().name(),
                        "previousStage", event.previousStage().name(),
                        "newStage", event.newStage().name(),
                        "newStatus", event.newStatus().name()));
    }

    // ---------- publication ----------

    @ApplicationModuleListener
    void on(PublicationVersioned event) {
        record("publication.versioned", event.submissionId(), null, event.occurredAt(),
                payload("publicationId", event.newPublicationId(),
                        "previousPublicationId", event.previousPublicationId(),
                        "newVersion", event.newVersion()));
    }

    @ApplicationModuleListener
    void on(PublicationPublished event) {
        record("publication.published", event.submissionId(), null, event.occurredAt(),
                payload("publicationId", event.publicationId(),
                        "version", event.version(),
                        "issueId", event.issueId(),
                        "sectionId", event.sectionId()));
    }

    @ApplicationModuleListener
    void on(PublicationUnpublished event) {
        record("publication.unpublished", event.submissionId(), null, event.occurredAt(),
                Map.of("publicationId", event.publicationId()));
    }

    // ---------- issue ----------

    @ApplicationModuleListener
    void on(IssuePublished event) {
        record("issue.published", null, null, event.occurredAt(),
                Map.of("issueId", event.issueId()));
    }

    @ApplicationModuleListener
    void on(IssueUnpublished event) {
        record("issue.unpublished", null, null, event.occurredAt(),
                Map.of("issueId", event.issueId()));
    }

    // ---------- helpers ----------

    private void record(String type, Long submissionId, Long actorUserId,
                        Instant occurredAt, Map<String, Object> payload) {
        EventLogEntry entry = new EventLogEntry();
        entry.setEventType(type);
        entry.setSubmissionId(submissionId);
        entry.setActorUserId(actorUserId);
        entry.setOccurredAt(occurredAt);
        entry.setPayload(payload == null ? Map.of() : payload);
        repository.save(entry);
    }

    /** Null-tolerant payload builder — Map.of rejects nulls. */
    private static Map<String, Object> payload(Object... pairs) {
        var m = new LinkedHashMap<String, Object>();
        for (int i = 0; i + 1 < pairs.length; i += 2) {
            String key = String.valueOf(pairs[i]);
            Object value = pairs[i + 1];
            if (value != null) {
                m.put(key, value);
            }
        }
        return m;
    }
}
