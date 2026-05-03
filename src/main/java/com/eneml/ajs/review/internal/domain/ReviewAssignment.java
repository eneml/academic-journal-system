package com.eneml.ajs.review.internal.domain;

import com.eneml.ajs.review.api.ReviewAssignmentStatus;
import com.eneml.ajs.review.api.ReviewMethod;
import com.eneml.ajs.review.api.ReviewRecommendation;
import com.eneml.ajs.shared.persistence.AuditableEntity;
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
@Table(name = "review_assignment")
@Getter
@Setter
public class ReviewAssignment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "review_round_id", nullable = false)
    private Long reviewRoundId;

    @Column(name = "reviewer_user_id", nullable = false)
    private Long reviewerUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_method", nullable = false, length = 32)
    private ReviewMethod reviewMethod = ReviewMethod.ANONYMOUS;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReviewAssignmentStatus status = ReviewAssignmentStatus.AWAITING_RESPONSE;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private ReviewRecommendation recommendation;

    @Column(name = "comments_to_editor", columnDefinition = "text")
    private String commentsToEditor;

    @Column(name = "comments_to_author", columnDefinition = "text")
    private String commentsToAuthor;

    @Column(name = "competing_interests", columnDefinition = "text")
    private String competingInterests;

    @Column(name = "date_assigned", nullable = false)
    private Instant dateAssigned = Instant.now();

    @Column(name = "date_notified")
    private Instant dateNotified;

    @Column(name = "date_response_due")
    private Instant dateResponseDue;

    @Column(name = "date_due")
    private Instant dateDue;

    @Column(name = "date_responded")
    private Instant dateResponded;

    @Column(name = "date_completed")
    private Instant dateCompleted;

    @Column(name = "date_confirmed")
    private Instant dateConfirmed;

    @Column(name = "invited_by_user_id", nullable = false)
    private Long invitedByUserId;

    public boolean canRespond() {
        return status == ReviewAssignmentStatus.AWAITING_RESPONSE;
    }

    public boolean canSubmitReview() {
        return status == ReviewAssignmentStatus.ACCEPTED
                || status == ReviewAssignmentStatus.IN_PROGRESS;
    }

    public boolean isFinal() {
        return status == ReviewAssignmentStatus.DECLINED
                || status == ReviewAssignmentStatus.CONFIRMED
                || status == ReviewAssignmentStatus.CANCELLED;
    }
}
