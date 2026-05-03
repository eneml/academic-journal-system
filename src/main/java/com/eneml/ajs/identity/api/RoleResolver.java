package com.eneml.ajs.identity.api;

import java.util.Set;

/**
 * Locally-recorded role grants (for audit + section-scoping). Broad
 * authorization at request time still flows through Spring Security
 * authorities derived from the JWT — this resolver answers the
 * "which sections does this user edit?" question that the JWT cannot.
 */
public interface RoleResolver {

    Set<Role> activeRolesOf(Long userId);

    boolean hasActiveRole(Long userId, Role role);

    /**
     * @return true if {@code userId} has an active {@link Role#SECTION_EDITOR}
     *         grant scoped to {@code sectionId}, or an unconditional EDITOR /
     *         ADMIN role
     */
    boolean canEditSection(Long userId, Long sectionId);

    Set<Long> sectionsEditedBy(Long userId);
}
