package com.eneml.ajs.identity.internal.application;

import com.eneml.ajs.identity.api.JwtClaims;
import com.eneml.ajs.identity.api.OrcidLinked;
import com.eneml.ajs.identity.api.UserProvisioning;
import com.eneml.ajs.identity.api.UserRegistered;
import com.eneml.ajs.identity.api.UserStatus;
import com.eneml.ajs.identity.internal.domain.User;
import com.eneml.ajs.identity.internal.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Objects;

@Service
@RequiredArgsConstructor
class UserProvisioningService implements UserProvisioning {

    private final UserRepository repository;
    private final ApplicationEventPublisher events;

    @Override
    @Transactional
    public Long ensureProvisioned(JwtClaims claims) {
        return repository.findByKeycloakSub(claims.subject())
                .map(existing -> refresh(existing, claims))
                .orElseGet(() -> createFrom(claims))
                .getId();
    }

    private User createFrom(JwtClaims claims) {
        User user = new User();
        user.setKeycloakSub(claims.subject());
        user.setEmail(claims.email());
        user.setUsername(claims.username());
        user.setGivenName(claims.givenName());
        user.setFamilyName(claims.familyName());
        user.setLocale(claims.locale() != null ? claims.locale() : "en");
        user.setStatus(UserStatus.ACTIVE);
        user.setOrcidId(claims.orcidId());
        user.setBiography(new HashMap<>());
        user.setLastLoginAt(Instant.now());
        User saved = repository.save(user);
        events.publishEvent(UserRegistered.of(saved.getId(), saved.getEmail()));
        if (saved.getOrcidId() != null) {
            events.publishEvent(OrcidLinked.of(saved.getId(), saved.getOrcidId()));
        }
        return saved;
    }

    private User refresh(User user, JwtClaims claims) {
        if (!Objects.equals(user.getEmail(), claims.email()) && claims.email() != null) {
            user.setEmail(claims.email());
        }
        if (claims.username() != null) {
            user.setUsername(claims.username());
        }
        if (claims.givenName() != null) {
            user.setGivenName(claims.givenName());
        }
        if (claims.familyName() != null) {
            user.setFamilyName(claims.familyName());
        }
        if (claims.locale() != null) {
            user.setLocale(claims.locale());
        }
        if (claims.orcidId() != null
                && !Objects.equals(user.getOrcidId(), claims.orcidId())) {
            user.setOrcidId(claims.orcidId());
            events.publishEvent(OrcidLinked.of(user.getId(), claims.orcidId()));
        }
        user.setLastLoginAt(Instant.now());
        return user;
    }
}
