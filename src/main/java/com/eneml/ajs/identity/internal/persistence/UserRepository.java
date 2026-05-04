package com.eneml.ajs.identity.internal.persistence;

import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.UserStatus;
import com.eneml.ajs.identity.internal.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByKeycloakSub(String keycloakSub);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Page<User> findByStatus(UserStatus status, Pageable pageable);

    /**
     * Direct SQL update of {@code last_login_at} that bypasses Hibernate
     * dirty-checking and the {@code @Version} optimistic-lock check. Two
     * concurrent authenticated requests for the same user race to bump
     * this timestamp; with a managed-entity update the loser fails the
     * @Version check and a request 500s. This single-column UPDATE doesn't
     * touch {@code version}, so concurrent writers are both safe — the
     * timestamp simply ends up as whichever wrote last.
     */
    @Modifying
    @Query(value = """
            UPDATE app_user
               SET last_login_at = :now,
                   updated_at    = :now
             WHERE id = :userId
            """, nativeQuery = true)
    int touchLastLogin(@Param("userId") long userId, @Param("now") Instant now);

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
