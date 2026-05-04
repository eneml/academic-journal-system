package com.eneml.ajs.publication.internal.domain;

import com.eneml.ajs.publication.api.DoiStatus;
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
@Table(name = "doi")
@Getter
@Setter
public class Doi extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String doi;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DoiStatus status = DoiStatus.NOT_REGISTERED;

    @Column(name = "registered_at")
    private Instant registeredAt;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    public void markRegistered() {
        this.status = DoiStatus.REGISTERED;
        this.registeredAt = Instant.now();
        this.errorMessage = null;
    }

    public void markSubmitted() {
        this.status = DoiStatus.SUBMITTED;
    }

    public void markFailed(String message) {
        this.status = DoiStatus.ERROR;
        this.errorMessage = message;
    }
}
