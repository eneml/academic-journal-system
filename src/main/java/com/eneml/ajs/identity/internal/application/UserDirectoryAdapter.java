package com.eneml.ajs.identity.internal.application;

import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.identity.internal.domain.User;
import com.eneml.ajs.identity.internal.persistence.UserRepository;
import com.eneml.ajs.identity.internal.web.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class UserDirectoryAdapter implements UserDirectoryService {

    private final UserRepository repository;
    private final UserMapper mapper;

    @Override
    public Optional<UserSummary> findById(Long userId) {
        return repository.findById(userId).map(mapper::toSummary);
    }

    @Override
    public Optional<UserSummary> findByKeycloakSub(String keycloakSub) {
        return repository.findByKeycloakSub(keycloakSub).map(mapper::toSummary);
    }

    @Override
    public Optional<UserSummary> findByEmail(String email) {
        return repository.findByEmailIgnoreCase(email).map(mapper::toSummary);
    }

    @Override
    public Map<Long, UserSummary> findByIds(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        return repository.findAllByIdIn(userIds).stream()
                .collect(Collectors.toMap(User::getId, mapper::toSummary));
    }

    @Override
    public List<UserSummary> findActiveWithRole(Role role) {
        return mapper.toSummaries(repository.findActiveWithRole(role));
    }
}
