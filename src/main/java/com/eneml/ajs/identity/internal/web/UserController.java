package com.eneml.ajs.identity.internal.web;

import com.eneml.ajs.identity.api.UserStatus;
import com.eneml.ajs.identity.internal.application.UserService;
import com.eneml.ajs.identity.internal.domain.User;
import com.eneml.ajs.identity.internal.web.dto.UserAdminUpdateRequest;
import com.eneml.ajs.identity.internal.web.dto.UserCreateRequest;
import com.eneml.ajs.identity.internal.web.dto.UserResponse;
import com.eneml.ajs.identity.internal.web.dto.UserSelfUpdateRequest;
import com.eneml.ajs.identity.internal.web.dto.UserStatusUpdateRequest;
import com.eneml.ajs.identity.internal.web.mapper.UserMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Local user accounts mirroring Keycloak identities")
class UserController {

    private final UserService service;
    private final UserMapper mapper;

    @GetMapping("/me")
    @Operation(summary = "Get the authenticated user's profile")
    UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return mapper.toResponse(service.getByKeycloakSub(jwt.getSubject()));
    }

    @PutMapping("/me")
    @Operation(summary = "Update the authenticated user's own profile")
    UserResponse updateMe(@AuthenticationPrincipal Jwt jwt,
                          @Valid @RequestBody UserSelfUpdateRequest request) {
        User me = service.getByKeycloakSub(jwt.getSubject());
        return mapper.toResponse(service.updateSelf(me.getId(), request));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/me/preferences")
    @Operation(summary = "Patch user preferences (locale, …) without resending the whole profile")
    UserResponse updatePreferences(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody com.eneml.ajs.identity.internal.web.dto.UserPreferencesPatch patch
    ) {
        User me = service.getByKeycloakSub(jwt.getSubject());
        return mapper.toResponse(service.patchPreferences(me.getId(), patch));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List users (admin)")
    Page<UserResponse> list(@RequestParam(required = false) UserStatus status,
                            Pageable pageable) {
        return service.list(status, pageable).map(mapper::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get a user by id (admin)")
    UserResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a user (admin) — keycloakSub must already exist in Keycloak")
    ResponseEntity<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
        User saved = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(saved.getId()).toUri();
        return ResponseEntity.created(location).body(mapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a user (admin)")
    UserResponse update(@PathVariable Long id,
                        @Valid @RequestBody UserAdminUpdateRequest request) {
        return mapper.toResponse(service.updateAsAdmin(id, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate, disable, or set pending on a user (admin)")
    UserResponse setStatus(@PathVariable Long id,
                           @Valid @RequestBody UserStatusUpdateRequest request) {
        return mapper.toResponse(service.setStatus(id, request.status()));
    }
}
