package com.eneml.ajs.identity.internal.application;

import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.RoleResolver;
import com.eneml.ajs.identity.internal.domain.UserRoleAssignment;
import com.eneml.ajs.identity.internal.persistence.UserRoleAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class RoleResolverAdapter implements RoleResolver {

    private final UserRoleAssignmentRepository repository;

    @Override
    public Set<Role> activeRolesOf(Long userId) {
        Set<Role> roles = repository.findActiveByUserId(userId).stream()
                .map(UserRoleAssignment::getRole)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(Role.class)));
        return Set.copyOf(roles);
    }

    @Override
    public boolean hasActiveRole(Long userId, Role role) {
        return repository.hasActiveRole(userId, role);
    }

    @Override
    public boolean canEditSection(Long userId, Long sectionId) {
        if (repository.hasActiveRole(userId, Role.ADMIN)
                || repository.hasActiveRole(userId, Role.EDITOR)) {
            return true;
        }
        return repository.findActive(userId, Role.SECTION_EDITOR, sectionId).isPresent();
    }

    @Override
    public Set<Long> sectionsEditedBy(Long userId) {
        return Set.copyOf(repository.findEditableSectionIds(userId));
    }
}
