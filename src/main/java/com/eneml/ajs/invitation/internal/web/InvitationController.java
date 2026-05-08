package com.eneml.ajs.invitation.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.invitation.internal.application.InvitationService;
import com.eneml.ajs.invitation.internal.domain.UserInvitation;
import com.eneml.ajs.invitation.internal.web.dto.InvitationCreateRequest;
import com.eneml.ajs.invitation.internal.web.dto.InvitationResponse;
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
@RequestMapping("/api/v1/invitations")
@RequiredArgsConstructor
@Tag(name = "Invitations")
class InvitationController {

    private final InvitationService service;
    private final UserDirectoryService userDirectory;

    @GetMapping
    @PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
    @Operation(summary = "List all invitations")
    List<InvitationResponse> list() {
        return service.listAll().stream().map(InvitationController::toResponse).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
    @Operation(summary = "Invite a user (typically a reviewer not yet on the system)")
    InvitationResponse create(@AuthenticationPrincipal Jwt jwt,
                               @Valid @RequestBody InvitationCreateRequest request) {
        Long invitedBy = userDirectory.findByKeycloakSub(jwt.getSubject())
                .map(u -> u.id())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()));
        InvitationService.Result result = service.create(request, invitedBy);
        return toResponse(result.invitation());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
    @Operation(summary = "Cancel a pending invitation")
    InvitationResponse cancel(@PathVariable Long id) {
        return toResponse(service.cancel(id));
    }

    @GetMapping("/by-key")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Look up an invitation by its secret key — used by the accept page")
    ResponseEntity<InvitationResponse> byKey(@RequestParam("key") String key) {
        try {
            return ResponseEntity.ok(toResponse(service.findByKey(key)));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/accept")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Accept an invitation. The current user is bound as the acceptor.")
    InvitationResponse accept(@AuthenticationPrincipal Jwt jwt,
                               @RequestParam("key") String key) {
        Long acceptor = userDirectory.findByKeycloakSub(jwt.getSubject())
                .map(u -> u.id())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()));
        return toResponse(service.accept(key, acceptor));
    }

    @PostMapping("/decline")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Decline an invitation without registering")
    InvitationResponse decline(@RequestParam("key") String key) {
        return toResponse(service.decline(key));
    }

    private static InvitationResponse toResponse(UserInvitation inv) {
        return new InvitationResponse(
                inv.getId(), inv.getType(), inv.getEmail(),
                inv.getPayload(), inv.getStatus(),
                inv.getInvitedByUserId(), inv.getAcceptedUserId(),
                inv.getExpiresAt(), inv.getAcceptedAt(),
                inv.getCreatedAt());
    }
}
