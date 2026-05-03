package com.eneml.ajs.editorial.internal.domain;

import com.eneml.ajs.editorial.api.DecisionType;
import com.eneml.ajs.shared.persistence.AuditableEntity;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
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
@Table(name = "editorial_decision")
@Getter
@Setter
public class EditorialDecision extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "review_round_id")
    private Long reviewRoundId;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_type", nullable = false, length = 40)
    private DecisionType decisionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_stage", nullable = false, length = 32)
    private SubmissionStage previousStage;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_stage", nullable = false, length = 32)
    private SubmissionStage newStage;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 16)
    private SubmissionStatus newStatus;

    @Column(name = "decided_by_user_id", nullable = false)
    private Long decidedByUserId;

    @Column(columnDefinition = "text")
    private String summary;

    @Column(name = "date_decided", nullable = false)
    private Instant dateDecided = Instant.now();
}
