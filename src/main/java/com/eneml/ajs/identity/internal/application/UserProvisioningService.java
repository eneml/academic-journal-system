package com.eneml.ajs.identity.internal.application;

import com.eneml.ajs.identity.api.JwtClaims;
import com.eneml.ajs.identity.api.OrcidLinked;
import com.eneml.ajs.identity.api.UserProvisioning;
import com.eneml.ajs.identity.api.UserRegistered;
import com.eneml.ajs.identity.api.UserStatus;
import com.eneml.ajs.identity.internal.domain.User;
import com.eneml.ajs.identity.internal.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Objects;

/**
 * Provisions the local {@link User} row that mirrors a Keycloak subject.
 * Called from the JWT auth converter on every authenticated request, so
 * this is on the hot path — concurrent requests for the same user can
 * (and do, especially when a UI fans out parallel API calls) race here.
 *
 * <p>Two safeguards keep that race correct:
 * <ol>
 *   <li><b>Skip the entity flush when nothing actually changed.</b> The
 *       common case is "user already exists, claims match, last login was
 *       recent" — that should be a single SELECT, no UPDATE, no @Version
 *       bump.</li>
 *   <li><b>Bump {@code last_login_at} via a direct SQL UPDATE that bypasses
 *       Hibernate's @Version check.</b> Concurrent requests racing the
 *       login-timestamp simply don't conflict; the column is touched in
 *       isolation and whichever transaction commits last wins.</li>
 * </ol>
 *
 * <p>For the rarer paths that DO need a managed-entity flush (claims
 * actually changed, or first-time provisioning), the refresh runs in
 * {@code REQUIRES_NEW} so the parent request's transaction isn't poisoned
 * by an unrelated provisioning hiccup, and we retry once on
 * optimistic-lock failure.
 */
@Service
@RequiredArgsConstructor
@Slf4j
class UserProvisioningService implements UserProvisioning {

    /** Don't touch last_login_at more often than this — write amplification protection. */
    private static final Duration LOGIN_TOUCH_DEBOUNCE = Duration.ofMinutes(2);

    private final UserRepository repository;
    private final ApplicationEventPublisher events;

    @Override
    @Transactional
    public Long ensureProvisioned(JwtClaims claims) {
        // Fast path: user already exists, claims match, last login is fresh.
        // No UPDATE, no @Version bump, concurrent calls don't race.
        var existing = repository.findByKeycloakSub(claims.subject());
        if (existing.isPresent()) {
            User user = existing.get();
            if (claimsMatch(user, claims)) {
                touchLoginIfStale(user);
                return user.getId();
            }
            // Claims drift (email/name/locale/orcid changed at IdP). Apply
            // the diff in a fresh tx so the parent flow's tx isn't tied to
            // optimistic-lock retry logic.
            return refreshWithRetry(user.getId(), claims);
        }
        // First-time provision — needs an INSERT. A unique-key collision can
        // still happen if two concurrent first-logins race; treat that as
        // "the other one won, just look it up" and try again.
        try {
            return createFrom(claims).getId();
        } catch (DataIntegrityViolationException race) {
            log.debug("Lost race to provision user {}; retrying lookup", claims.subject());
            return repository.findByKeycloakSub(claims.subject())
                    .map(u -> {
                        touchLoginIfStale(u);
                        return u.getId();
                    })
                    .orElseThrow(() -> race);
        }
    }

    /**
     * True when the entity already reflects every relevant claim from the
     * JWT. Deliberately ignores {@code lastLoginAt} — that's tracked
     * separately so we never dirty the entity just to bump a timestamp.
     */
    private static boolean claimsMatch(User user, JwtClaims claims) {
        return Objects.equals(user.getEmail(), claims.email())
                && (claims.username() == null || Objects.equals(user.getUsername(), claims.username()))
                && (claims.givenName() == null || Objects.equals(user.getGivenName(), claims.givenName()))
                && (claims.familyName() == null || Objects.equals(user.getFamilyName(), claims.familyName()))
                && (claims.locale() == null || Objects.equals(user.getLocale(), claims.locale()))
                && (claims.orcidId() == null || Objects.equals(user.getOrcidId(), claims.orcidId()));
    }

    /**
     * If the cached lastLoginAt is older than the debounce window, fire a
     * direct SQL UPDATE to bump it. The UPDATE doesn't touch {@code version},
     * so concurrent callers can both run it without racing the optimistic
     * lock — the column simply ends up as whichever transaction committed
     * last.
     */
    private void touchLoginIfStale(User user) {
        Instant last = user.getLastLoginAt();
        Instant now = Instant.now();
        if (last == null || Duration.between(last, now).compareTo(LOGIN_TOUCH_DEBOUNCE) >= 0) {
            try {
                repository.touchLastLogin(user.getId(), now);
            } catch (RuntimeException e) {
                // Best-effort timestamp — failures shouldn't break the request.
                log.warn("touch lastLoginAt for user {} failed: {}",
                        user.getId(), e.getMessage());
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    Long refreshWithRetry(long userId, JwtClaims claims) {
        try {
            return refreshOnce(userId, claims);
        } catch (OptimisticLockingFailureException race) {
            // Concurrent claim refresh — re-read and try once more. Most of
            // the time the second pass finds claims already in sync (the
            // other thread got there first) and just touches login.
            log.debug("Optimistic-lock race on user {} refresh; retrying once", userId);
            return refreshOnce(userId, claims);
        }
    }

    private Long refreshOnce(long userId, JwtClaims claims) {
        User user = repository.findById(userId).orElseThrow();
        if (claimsMatch(user, claims)) {
            // Another thread already applied the diff before we got here.
            touchLoginIfStale(user);
            return user.getId();
        }
        applyClaimDiff(user, claims);
        // Hibernate flush will UPDATE with @Version check; that's fine
        // because we're in our own REQUIRES_NEW tx and we retry on conflict.
        return user.getId();
    }

    private void applyClaimDiff(User user, JwtClaims claims) {
        if (claims.email() != null && !Objects.equals(user.getEmail(), claims.email())) {
            user.setEmail(claims.email());
        }
        if (claims.username() != null && !Objects.equals(user.getUsername(), claims.username())) {
            user.setUsername(claims.username());
        }
        if (claims.givenName() != null && !Objects.equals(user.getGivenName(), claims.givenName())) {
            user.setGivenName(claims.givenName());
        }
        if (claims.familyName() != null && !Objects.equals(user.getFamilyName(), claims.familyName())) {
            user.setFamilyName(claims.familyName());
        }
        if (claims.locale() != null && !Objects.equals(user.getLocale(), claims.locale())) {
            user.setLocale(claims.locale());
        }
        if (claims.orcidId() != null
                && !Objects.equals(user.getOrcidId(), claims.orcidId())) {
            user.setOrcidId(claims.orcidId());
            events.publishEvent(OrcidLinked.of(user.getId(), claims.orcidId()));
        }
        user.setLastLoginAt(Instant.now());
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
}
