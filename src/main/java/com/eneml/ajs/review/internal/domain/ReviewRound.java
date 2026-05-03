package com.eneml.ajs.review.internal.domain;

import com.eneml.ajs.review.api.ReviewRoundStatus;
import com.eneml.ajs.shared.persistence.AuditableEntity;
import com.eneml.ajs.submission.api.SubmissionStage;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "review_round")
@Getter
@Setter
public class ReviewRound extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SubmissionStage stage = SubmissionStage.EXTERNAL_REVIEW;

    @Column(name = "round_number", nullable = false)
    private int roundNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReviewRoundStatus status = ReviewRoundStatus.PENDING_REVIEWERS;

    @Column(name = "date_started", nullable = false)
    private Instant dateStarted = Instant.now();

    @Column(name = "date_completed")
    private Instant dateCompleted;

    public void markCompleted() {
        if (this.dateCompleted == null) {
            this.dateCompleted = Instant.now();
        }
        this.status = ReviewRoundStatus.COMPLETED;
    }

    public void markCancelled() {
        this.status = ReviewRoundStatus.CANCELLED;
        this.dateCompleted = Instant.now();
    }
}
