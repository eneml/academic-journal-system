package com.eneml.ajs.identity.internal.web;

import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.internal.application.UserRoleService;
import com.eneml.ajs.identity.internal.application.UserService;
import com.eneml.ajs.identity.internal.domain.UserRoleAssignment;
import com.eneml.ajs.identity.internal.web.dto.UserRoleAssignRequest;
import com.eneml.ajs.identity.internal.web.dto.UserRoleAssignmentResponse;
import com.eneml.ajs.identity.internal.web.mapper.UserRoleAssignmentMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/{userId}/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "User roles", description = "Locally tracked role grants per user")
class UserRoleController {

    private final UserRoleService roleService;
    private final UserService userService;
    private final UserRoleAssignmentMapper mapper;

    @GetMapping
    @Operation(summary = "List active role grants for a user")
    List<UserRoleAssignmentResponse> list(@PathVariable Long userId) {
        return mapper.toResponses(roleService.listActive(userId));
    }

    @PostMapping
    @Operation(summary = "Grant a role to a user")
    ResponseEntity<UserRoleAssignmentResponse> assign(
            @PathVariable Long userId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UserRoleAssignRequest request) {
        Long assignedBy = userService.getByKeycloakSub(jwt.getSubject()).getId();
        UserRoleAssignment saved = roleService.assign(
                userId, request.role(), request.scopeSectionId(), assignedBy);
        return ResponseEntity.status(201).body(mapper.toResponse(saved));
    }

    @DeleteMapping("/{role}")
    @Operation(summary = "Revoke a role grant; pass scopeSectionId for SECTION_EDITOR")
    ResponseEntity<Void> revoke(@PathVariable Long userId,
                                @PathVariable Role role,
                                @RequestParam(required = false) Long scopeSectionId) {
        roleService.revoke(userId, role, scopeSectionId);
        return ResponseEntity.noContent().build();
    }
}
