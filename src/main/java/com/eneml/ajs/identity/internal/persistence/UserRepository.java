package com.eneml.ajs.identity.internal.persistence;

import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.UserStatus;
import com.eneml.ajs.identity.internal.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByKeycloakSub(String keycloakSub);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Page<User> findByStatus(UserStatus status, Pageable pageable);

    @Query("""
            SELECT DISTINCT u
            FROM User u
            JOIN UserRoleAssignment ra ON ra.userId = u.id
            WHERE ra.role = :role
              AND ra.dateRevoked IS NULL
              AND u.status = com.eneml.ajs.identity.api.UserStatus.ACTIVE
            ORDER BY u.familyName, u.givenName, u.id
            """)
    List<User> findActiveWithRole(@Param("role") Role role);

    List<User> findAllByIdIn(Collection<Long> ids);
}
