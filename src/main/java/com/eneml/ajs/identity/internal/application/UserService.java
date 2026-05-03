package com.eneml.ajs.identity.internal.application;

import com.eneml.ajs.identity.api.UserActivated;
import com.eneml.ajs.identity.api.UserDisabled;
import com.eneml.ajs.identity.api.UserRegistered;
import com.eneml.ajs.identity.api.UserStatus;
import com.eneml.ajs.identity.internal.domain.User;
import com.eneml.ajs.identity.internal.persistence.UserRepository;
import com.eneml.ajs.identity.internal.web.dto.UserAdminUpdateRequest;
import com.eneml.ajs.identity.internal.web.dto.UserCreateRequest;
import com.eneml.ajs.identity.internal.web.dto.UserSelfUpdateRequest;
import com.eneml.ajs.identity.internal.web.mapper.UserMapper;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository repository;
    private final UserMapper mapper;
    private final ApplicationEventPublisher events;

    public User get(Long id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("User", id));
    }

    public User getByKeycloakSub(String keycloakSub) {
        return repository.findByKeycloakSub(keycloakSub)
                .orElseThrow(() -> NotFoundException.of("User", keycloakSub));
    }

    public Page<User> list(UserStatus statusFilter, Pageable pageable) {
        return statusFilter == null
                ? repository.findAll(pageable)
                : repository.findByStatus(statusFilter, pageable);
    }

    @Transactional
    public User create(UserCreateRequest request) {
        if (repository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException(
                    "User with email '%s' already exists".formatted(request.email()));
        }
        User user = mapper.toEntity(request);
        user.setStatus(UserStatus.ACTIVE);
        User saved = repository.save(user);
        events.publishEvent(UserRegistered.of(saved.getId(), saved.getEmail()));
        return saved;
    }

    @Transactional
    public User updateSelf(Long userId, UserSelfUpdateRequest request) {
        User user = get(userId);
        mapper.applySelfUpdate(request, user);
        return user;
    }

    @Transactional
    public User updateAsAdmin(Long userId, UserAdminUpdateRequest request) {
        User user = get(userId);
        if (!user.getEmail().equalsIgnoreCase(request.email())
                && repository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException(
                    "User with email '%s' already exists".formatted(request.email()));
        }
        mapper.applyAdminUpdate(request, user);
        return user;
    }

    @Transactional
    public User setStatus(Long userId, UserStatus newStatus) {
        User user = get(userId);
        if (user.getStatus() == newStatus) {
            return user;
        }
        user.setStatus(newStatus);
        switch (newStatus) {
            case ACTIVE -> events.publishEvent(UserActivated.of(userId));
            case DISABLED -> events.publishEvent(UserDisabled.of(userId));
            case PENDING -> { /* no event for pending */ }
        }
        return user;
    }
}
