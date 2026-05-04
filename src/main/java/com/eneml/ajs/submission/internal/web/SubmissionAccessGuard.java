package com.eneml.ajs.submission.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.submission.internal.application.SubmissionService;
import com.eneml.ajs.submission.internal.domain.Submission;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Collection;

/**
 * Centralized ownership / role check used by every submission-scoped
 * controller. Either the submission's owner OR a member of the
 * editorial team (EDITOR / SECTION_EDITOR / ADMIN) may proceed.
 * Anything else throws {@link AccessDeniedException}.
 */
@Component
@RequiredArgsConstructor
public class SubmissionAccessGuard {

    private final SubmissionService submissionService;
    private final UserDirectoryService userDirectory;

    public void requireOwnerOrEditor(Jwt jwt, Long submissionId) {
        Submission s = submissionService.get(submissionId);
        Long me = currentUserId(jwt);
        if (s.getSubmittedByUserId() != null && s.getSubmittedByUserId().equals(me)) return;
        if (hasEditorialAuthority(jwt)) return;
        throw new AccessDeniedException(
                "Not allowed to access submission " + submissionId);
    }

    public Long currentUserId(Jwt jwt) {
        return userDirectory.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()))
                .id();
    }

    public boolean hasEditorialAuthority(Jwt jwt) {
        var realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) return false;
        var roles = realmAccess.get("roles");
        if (!(roles instanceof Collection<?> coll)) return false;
        return coll.stream().anyMatch(r ->
                "EDITOR".equalsIgnoreCase(String.valueOf(r))
                        || "ADMIN".equalsIgnoreCase(String.valueOf(r))
                        || "SECTION_EDITOR".equalsIgnoreCase(String.valueOf(r)));
    }
}
