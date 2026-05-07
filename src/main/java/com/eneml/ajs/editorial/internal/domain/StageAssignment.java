package com.eneml.ajs.editorial.internal.domain;

import com.eneml.ajs.editorial.api.StageRole;
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

/**
 * Persistent record of "user X is involved in stage Y of submission Z as
 * role R". Drives the workflow Participants panel and gates which
 * decision-action buttons each viewer sees (an editor with
 * {@code recommend_only=true} only gets Recommend actions).
 */
@Entity
@Table(name = "stage_assignment")
@Getter
@Setter
public class StageAssignment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SubmissionStage stage;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private StageRole role;

    @Column(name = "can_change_metadata", nullable = false)
    private boolean canChangeMetadata = false;

    @Column(name = "recommend_only", nullable = false)
    private boolean recommendOnly = false;

    @Column(name = "date_assigned", nullable = false)
    private Instant dateAssigned = Instant.now();

    @Column(name = "assigned_by_user_id")
    private Long assignedByUserId;
}
