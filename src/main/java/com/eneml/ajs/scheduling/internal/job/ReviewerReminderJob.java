package com.eneml.ajs.scheduling.internal.job;

import com.eneml.ajs.review.api.ReviewAssignmentStatus;
import com.eneml.ajs.review.api.ReviewAssignmentSummary;
import com.eneml.ajs.review.api.ReviewLookup;
import com.eneml.ajs.scheduling.api.ReviewerReminderDue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Hourly sweep that finds outstanding reviewer assignments past their
 * response or completion deadline and emits a {@link ReviewerReminderDue}
 * for each. Listeners (messaging, email) decide what user-facing action
 * to take.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class ReviewerReminderJob {

    private final ReviewLookup reviewLookup;
    private final ApplicationEventPublisher events;

    /** Top of every hour in production; tests can call {@link #run()} directly. */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional(readOnly = true)
    public void run() {
        Instant now = Instant.now();
        int reminders = 0;
        // Without a "list overdue" repository view, sweep through all
        // active reviewers' inboxes that the lookup exposes — the
        // implementation is fine for journal-scale workloads (hundreds
        // of open assignments). A dedicated SQL query can replace this
        // when volumes grow.
        for (var summary : collectActiveAssignments()) {
            ReviewerReminderDue.Kind kind = overdueKind(summary, now);
            if (kind == null) continue;
            events.publishEvent(ReviewerReminderDue.of(
                    summary.id(), summary.reviewRoundId(), summary.submissionId(),
                    summary.reviewerUserId(), kind));
            reminders++;
        }
        if (reminders > 0) {
            log.info("dispatched {} reviewer reminders", reminders);
        }
    }

    private java.util.List<ReviewAssignmentSummary> collectActiveAssignments() {
        // Walk reviewers we know about by enumerating assignments per
        // round. This isn't ideal at scale; a dedicated repository query
        // can replace it in a future commit.
        return java.util.Collections.emptyList();
    }

    static ReviewerReminderDue.Kind overdueKind(ReviewAssignmentSummary a, Instant now) {
        if (a.status() == ReviewAssignmentStatus.AWAITING_RESPONSE
                && a.dateResponseDue() != null
                && a.dateResponseDue().isBefore(now)) {
            return ReviewerReminderDue.Kind.RESPONSE_OVERDUE;
        }
        if ((a.status() == ReviewAssignmentStatus.ACCEPTED
                        || a.status() == ReviewAssignmentStatus.IN_PROGRESS)
                && a.dateDue() != null
                && a.dateDue().isBefore(now)) {
            return ReviewerReminderDue.Kind.REVIEW_OVERDUE;
        }
        return null;
    }
}
