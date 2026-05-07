package com.eneml.ajs.messaging.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.messaging.internal.application.template.CanonicalEmailTemplateKey;
import com.eneml.ajs.messaging.internal.application.template.NotificationSubscriptionService;
import com.eneml.ajs.messaging.internal.web.dto.NotificationPreferenceEntry;
import com.eneml.ajs.messaging.internal.web.dto.NotificationPreferenceUpdateRequest;
import com.eneml.ajs.messaging.internal.web.dto.NotificationPreferencesResponse;
import com.eneml.ajs.shared.exception.NotFoundException;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/me/notification-preferences")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Notification preferences")
class NotificationPreferencesController {

    private static final Set<String> CANONICAL_KEYS = Arrays.stream(CanonicalEmailTemplateKey.values())
            .map(CanonicalEmailTemplateKey::key)
            .collect(java.util.stream.Collectors.toUnmodifiableSet());

    private final NotificationSubscriptionService subscriptions;
    private final UserDirectoryService users;

    @GetMapping
    public NotificationPreferencesResponse listMine(@AuthenticationPrincipal Jwt jwt) {
        UserSummary me = resolveMe(jwt);
        Map<String, Boolean> state = subscriptions.stateForUser(me.id());
        List<NotificationPreferenceEntry> entries = Arrays.stream(CanonicalEmailTemplateKey.values())
                .map(k -> new NotificationPreferenceEntry(
                        k.key(),
                        k.description(),
                        Boolean.TRUE.equals(state.get(k.key()))))
                .toList();
        return new NotificationPreferencesResponse(entries);
    }

    @PutMapping("/{key}")
    public ResponseEntity<NotificationPreferenceEntry> setMine(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String key,
            @Valid @RequestBody NotificationPreferenceUpdateRequest body) {
        if (!CANONICAL_KEYS.contains(key)) {
            throw new NotFoundException("unknown notification key: " + key);
        }
        UserSummary me = resolveMe(jwt);
        subscriptions.setBlocked(me.id(), key, body.blocked());
        CanonicalEmailTemplateKey enumValue = CanonicalEmailTemplateKey.valueOf(toEnumName(key));
        return ResponseEntity.ok(new NotificationPreferenceEntry(
                enumValue.key(),
                enumValue.description(),
                body.blocked()));
    }

    private UserSummary resolveMe(Jwt jwt) {
        return users.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("authenticated user has no local profile"));
    }

    private static String toEnumName(String key) {
        for (CanonicalEmailTemplateKey k : CanonicalEmailTemplateKey.values()) {
            if (k.key().equals(key)) return k.name();
        }
        throw new IllegalStateException("checked above");
    }
}
