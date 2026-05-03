package com.eneml.ajs.identity.internal.domain;

import com.eneml.ajs.identity.api.Role;
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
@Table(name = "user_role_assignment")
@Getter
@Setter
public class UserRoleAssignment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Role role;

    /** Set only when {@link #role} is {@link Role#SECTION_EDITOR}. */
    @Column(name = "scope_section_id")
    private Long scopeSectionId;

    @Column(name = "assigned_by_user_id")
    private Long assignedByUserId;

    @Column(name = "date_assigned", nullable = false)
    private Instant dateAssigned = Instant.now();

    @Column(name = "date_revoked")
    private Instant dateRevoked;

    public boolean isActive() {
        return dateRevoked == null;
    }

    public void revoke() {
        if (dateRevoked == null) {
            dateRevoked = Instant.now();
        }
    }
}
