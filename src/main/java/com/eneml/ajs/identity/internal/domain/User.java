package com.eneml.ajs.identity.internal.domain;

import com.eneml.ajs.identity.api.UserStatus;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "app_user")
@Getter
@Setter
public class User extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "keycloak_sub", nullable = false, unique = true, length = 64)
    private String keycloakSub;

    @Column(nullable = false, unique = true, length = 254,
            columnDefinition = "citext")
    private String email;

    @Column(unique = true, length = 128)
    private String username;

    @Column(name = "given_name", length = 128)
    private String givenName;

    @Column(name = "family_name", length = 128)
    private String familyName;

    @Column(nullable = false, length = 8)
    private String locale = "en";

    @Column(length = 2)
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "orcid_id", length = 19)
    private String orcidId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> biography = new HashMap<>();

    @Column(length = 512)
    private String affiliation;

    @Column(name = "public_url", length = 2048)
    private String publicUrl;

    @Column(columnDefinition = "text")
    private String signature;

    /** Editor-only private note about this user; never shown to the user. */
    @Column(name = "gossip_note", columnDefinition = "text")
    private String gossipNote;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    public void disable() {
        this.status = UserStatus.DISABLED;
    }

    public void activate() {
        this.status = UserStatus.ACTIVE;
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }
}
