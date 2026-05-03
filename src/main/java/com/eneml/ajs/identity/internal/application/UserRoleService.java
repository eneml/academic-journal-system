package com.eneml.ajs.identity.internal.application;

import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.UserRoleAssigned;
import com.eneml.ajs.identity.api.UserRoleRevoked;
import com.eneml.ajs.identity.internal.domain.UserRoleAssignment;
import com.eneml.ajs.identity.internal.persistence.UserRepository;
import com.eneml.ajs.identity.internal.persistence.UserRoleAssignmentRepository;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserRoleService {

    private final UserRoleAssignmentRepository repository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher events;

    public List<UserRoleAssignment> listActive(Long userId) {
        ensureUserExists(userId);
        return repository.findActiveByUserId(userId);
    }

    @Transactional
    public UserRoleAssignment assign(Long userId, Role role, Long scopeSectionId, Long assignedBy) {
        ensureUserExists(userId);
        validateScope(role, scopeSectionId);

        if (repository.findActive(userId, role, scopeSectionId).isPresent()) {
            throw new ConflictException("User %d already has active %s%s grant"
                    .formatted(userId, role,
                            scopeSectionId == null ? "" : " on section " + scopeSectionId));
        }

        UserRoleAssignment assignment = new UserRoleAssignment();
        assignment.setUserId(userId);
        assignment.setRole(role);
        assignment.setScopeSectionId(scopeSectionId);
        assignment.setAssignedByUserId(assignedBy);
        UserRoleAssignment saved = repository.save(assignment);
        events.publishEvent(UserRoleAssigned.of(userId, role, scopeSectionId));
        return saved;
    }

    @Transactional
    public void revoke(Long userId, Role role, Long scopeSectionId) {
        UserRoleAssignment assignment = repository.findActive(userId, role, scopeSectionId)
                .orElseThrow(() -> NotFoundException.of(
                        "Active role assignment",
                        "%d/%s%s".formatted(userId, role,
                                scopeSectionId == null ? "" : "/" + scopeSectionId)));
        assignment.revoke();
        events.publishEvent(UserRoleRevoked.of(userId, role, scopeSectionId));
    }

    private void ensureUserExists(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw NotFoundException.of("User", userId);
        }
    }

    private static void validateScope(Role role, Long scopeSectionId) {
        if (role == Role.SECTION_EDITOR && scopeSectionId == null) {
            throw new IllegalArgumentException(
                    "SECTION_EDITOR requires a scopeSectionId");
        }
        if (role != Role.SECTION_EDITOR && scopeSectionId != null) {
            throw new IllegalArgumentException(
                    "Only SECTION_EDITOR may carry a scopeSectionId");
        }
    }
}
