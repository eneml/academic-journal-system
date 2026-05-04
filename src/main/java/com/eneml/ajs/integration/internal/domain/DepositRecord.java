package com.eneml.ajs.integration.internal.domain;

import com.eneml.ajs.integration.api.DepositStatus;
import com.eneml.ajs.integration.api.DepositSubject;
import com.eneml.ajs.integration.api.DepositTarget;
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
@Table(name = "deposit_record")
@Getter
@Setter
public class DepositRecord extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DepositTarget target;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, length = 32)
    private DepositSubject subjectType;

    @Column(name = "subject_id", nullable = false)
    private Long subjectId;

    /** External reference returned by the remote system (e.g. CrossRef batch id, ORCID put-code). */
    @Column(name = "external_ref", length = 255)
    private String externalRef;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DepositStatus status = DepositStatus.PENDING;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "last_attempt_at")
    private Instant lastAttemptAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(columnDefinition = "text")
    private String payload;

    @Column(columnDefinition = "text")
    private String response;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    public void markSent(String response) {
        this.status = DepositStatus.SENT;
        this.response = response;
        this.lastAttemptAt = Instant.now();
        this.attempts++;
    }

    public void markAccepted(String externalRef) {
        this.status = DepositStatus.ACCEPTED;
        this.externalRef = externalRef;
        this.completedAt = Instant.now();
        this.errorMessage = null;
    }

    public void markFailed(String error) {
        this.status = DepositStatus.FAILED;
        this.errorMessage = error;
        this.lastAttemptAt = Instant.now();
        this.attempts++;
    }

    public void markSkipped(String reason) {
        this.status = DepositStatus.SKIPPED;
        this.errorMessage = reason;
        this.completedAt = Instant.now();
    }
}
