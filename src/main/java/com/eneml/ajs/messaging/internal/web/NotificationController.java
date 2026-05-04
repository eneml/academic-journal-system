package com.eneml.ajs.messaging.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import com.eneml.ajs.messaging.internal.web.dto.NotificationResponse;
import com.eneml.ajs.messaging.internal.web.mapper.NotificationMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Notifications")
class NotificationController {

    private final NotificationService service;
    private final NotificationMapper mapper;
    private final UserDirectoryService userDirectory;

    @GetMapping
    @Operation(summary = "Recent in-app notifications for the current user")
    List<NotificationResponse> mine(@AuthenticationPrincipal Jwt jwt,
                                     @RequestParam(defaultValue = "20") int limit) {
        return mapper.toResponses(service.recentFor(currentUserId(jwt), limit));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Number of unread notifications (for badge)")
    Map<String, Long> unreadCount(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("unread", service.unreadCountFor(currentUserId(jwt)));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    NotificationResponse markRead(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return mapper.toResponse(service.markRead(id, currentUserId(jwt)));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark every unread notification as read")
    ResponseEntity<Map<String, Integer>> markAllRead(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(Map.of("updated", service.markAllRead(currentUserId(jwt))));
    }

    private Long currentUserId(Jwt jwt) {
        return userDirectory.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()))
                .id();
    }
}
