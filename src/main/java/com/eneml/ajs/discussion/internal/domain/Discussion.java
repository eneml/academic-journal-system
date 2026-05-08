package com.eneml.ajs.discussion.internal.domain;

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
@Table(name = "discussion")
@Getter
@Setter
public class Discussion extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SubmissionStage stage;

    @Column(nullable = false, length = 512)
    private String subject;

    @Column(name = "started_by_user_id", nullable = false)
    private Long startedByUserId;

    @Column(nullable = false)
    private int seq = 0;

    @Column(nullable = false)
    private boolean closed = false;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "date_started", nullable = false)
    private Instant dateStarted = Instant.now();

    @Column(name = "date_modified", nullable = false)
    private Instant dateModified = Instant.now();
}
