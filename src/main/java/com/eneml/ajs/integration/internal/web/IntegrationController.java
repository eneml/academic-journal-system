package com.eneml.ajs.integration.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.integration.api.DepositSubject;
import com.eneml.ajs.integration.api.DepositSummary;
import com.eneml.ajs.integration.api.DepositTarget;
import com.eneml.ajs.integration.internal.application.CrossRefDepositXmlGenerator;
import com.eneml.ajs.integration.internal.application.DepositService;
import com.eneml.ajs.integration.internal.application.JatsGenerator;
import com.eneml.ajs.integration.internal.application.OrcidAuthService;
import com.eneml.ajs.shared.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/integration")
@RequiredArgsConstructor
@Tag(name = "Integration")
class IntegrationController {

    private final JatsGenerator jatsGenerator;
    private final CrossRefDepositXmlGenerator crossRefGenerator;
    private final DepositService depositService;
    private final OrcidAuthService orcidAuthService;
    private final UserDirectoryService userDirectory;

    @GetMapping(value = "/publications/{publicationId}/jats",
                produces = MediaType.APPLICATION_XML_VALUE)
    @PreAuthorize("hasAnyRole('EDITOR','PRODUCTION_STAFF','ADMIN')")
    @Operation(summary = "Generate the JATS XML rendition of a publication")
    ResponseEntity<String> jatsXml(@PathVariable Long publicationId) {
        String xml = jatsGenerator.generate(publicationId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(xml);
    }

    @GetMapping(value = "/publications/{publicationId}/crossref",
                produces = MediaType.APPLICATION_XML_VALUE)
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Preview the CrossRef deposit XML for a publication")
    ResponseEntity<String> crossrefXml(@PathVariable Long publicationId) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(crossRefGenerator.generate(publicationId));
    }

    @GetMapping("/publications/{publicationId}/deposits")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "List all outbound deposit attempts for a publication")
    List<DepositSummary> deposits(@PathVariable Long publicationId) {
        return depositService.historyFor(DepositSubject.PUBLICATION, publicationId);
    }

    @PostMapping("/publications/{publicationId}/deposits/{target}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Manually enqueue a deposit attempt to CrossRef or ORCID")
    DepositSummary enqueue(@PathVariable Long publicationId, @PathVariable DepositTarget target) {
        var record = depositService.enqueue(target, DepositSubject.PUBLICATION, publicationId);
        return new DepositSummary(
                record.getId(),
                record.getTarget(),
                record.getSubjectType(),
                record.getSubjectId(),
                record.getExternalRef(),
                record.getStatus(),
                record.getAttempts(),
                record.getLastAttemptAt(),
                record.getCompletedAt(),
                record.getErrorMessage());
    }

    // ---------- ORCID OAuth flow ----------

    @GetMapping("/orcid/authorize-url")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get an ORCID authorize URL for the current user")
    Map<String, String> orcidAuthorizeUrl(@AuthenticationPrincipal Jwt jwt) {
        Long userId = userDirectory.findByKeycloakSub(jwt.getSubject())
                .map(u -> u.id())
                .orElseThrow(() -> NotFoundException.of("User", jwt.getSubject()));
        return Map.of("url", orcidAuthService.buildAuthorizeUrl(userId));
    }

    /**
     * ORCID redirects the browser back here with the authorization code +
     * the state token we minted before the user left for ORCID. We swap
     * the code for tokens, persist them, and redirect into the editorial
     * app's profile page so the user sees the link as confirmed.
     */
    @GetMapping("/orcid/callback")
    ResponseEntity<Void> orcidCallback(@RequestParam String code,
                                       @RequestParam String state) {
        orcidAuthService.handleCallback(code, state);
        // Send the user back to the editorial app — base URL is
        // configurable; the profile page is where they kicked off the flow.
        URI redirect = URI.create("/profile?orcid=connected");
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirect.toString())
                .build();
    }
}
