package com.eneml.ajs.integration.internal.domain;

import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * OAuth tokens held on behalf of a user so the integration module can
 * push work records to ORCID. PK is the local user id; cascade delete
 * is handled at the database level (see V90 migration).
 */
@Entity
@Table(name = "orcid_credentials")
@Getter
@Setter
public class OrcidCredentials extends AuditableEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "orcid_id", nullable = false, length = 19)
    private String orcidId;

    @Column(name = "access_token", nullable = false, columnDefinition = "text")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "text")
    private String refreshToken;

    @Column(nullable = false, length = 255)
    private String scope = "/activities/update";

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "last_pushed_at")
    private Instant lastPushedAt;

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(Instant.now());
    }
}
