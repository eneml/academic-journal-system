package com.eneml.ajs.identity.internal.persistence;

import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.internal.domain.UserRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRoleAssignmentRepository
        extends JpaRepository<UserRoleAssignment, Long> {

    @Query("""
            SELECT ra FROM UserRoleAssignment ra
            WHERE ra.userId = :userId AND ra.dateRevoked IS NULL
            ORDER BY ra.role, ra.scopeSectionId
            """)
    List<UserRoleAssignment> findActiveByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT ra FROM UserRoleAssignment ra
            WHERE ra.userId = :userId
              AND ra.role = :role
              AND ((:scopeSectionId IS NULL AND ra.scopeSectionId IS NULL)
                   OR ra.scopeSectionId = :scopeSectionId)
              AND ra.dateRevoked IS NULL
            """)
    Optional<UserRoleAssignment> findActive(
            @Param("userId") Long userId,
            @Param("role") Role role,
            @Param("scopeSectionId") Long scopeSectionId);

    @Query("""
            SELECT COUNT(ra) > 0 FROM UserRoleAssignment ra
            WHERE ra.userId = :userId
              AND ra.role = :role
              AND ra.dateRevoked IS NULL
            """)
    boolean hasActiveRole(@Param("userId") Long userId, @Param("role") Role role);

    @Query("""
            SELECT ra.scopeSectionId FROM UserRoleAssignment ra
            WHERE ra.userId = :userId
              AND ra.role = com.eneml.ajs.identity.api.Role.SECTION_EDITOR
              AND ra.scopeSectionId IS NOT NULL
              AND ra.dateRevoked IS NULL
            """)
    List<Long> findEditableSectionIds(@Param("userId") Long userId);
}
