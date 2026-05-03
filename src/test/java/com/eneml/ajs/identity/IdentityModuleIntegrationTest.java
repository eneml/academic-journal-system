package com.eneml.ajs.identity;

import com.eneml.ajs.identity.api.JwtClaims;
import com.eneml.ajs.identity.api.OrcidLinked;
import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.RoleResolver;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserProvisioning;
import com.eneml.ajs.identity.api.UserRegistered;
import com.eneml.ajs.identity.api.UserRoleAssigned;
import com.eneml.ajs.identity.api.UserRoleRevoked;
import com.eneml.ajs.identity.api.UserStatus;
import com.eneml.ajs.identity.internal.application.UserRoleService;
import com.eneml.ajs.identity.internal.application.UserService;
import com.eneml.ajs.shared.exception.ConflictException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@RecordApplicationEvents
@Transactional
class IdentityModuleIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired UserProvisioning provisioning;
    @Autowired UserDirectoryService userDirectory;
    @Autowired RoleResolver roleResolver;
    @Autowired UserService userService;
    @Autowired UserRoleService roleService;
    @Autowired Converter<Jwt, AbstractAuthenticationToken> jwtConverter;
    @Autowired ApplicationEvents events;

    // ------------------------------------------------------------------
    // Lazy provisioning
    // ------------------------------------------------------------------

    @Test
    void firstSeenJwtCreatesLocalUserAndEmitsRegisteredEvent() {
        Long userId = provisioning.ensureProvisioned(claims(
                "kc-sub-001", "alice@example.com", "alice", "Alice", "Wonder", "en", null));

        assertThat(userId).isNotNull();
        assertThat(userDirectory.findByKeycloakSub("kc-sub-001"))
                .get()
                .satisfies(u -> {
                    assertThat(u.email()).isEqualTo("alice@example.com");
                    assertThat(u.fullName()).isEqualTo("Alice Wonder");
                    assertThat(u.status()).isEqualTo(UserStatus.ACTIVE);
                });
        assertThat(events.stream(UserRegistered.class))
                .singleElement()
                .satisfies(e -> assertThat(e.email()).isEqualTo("alice@example.com"));
    }

    @Test
    void subsequentJwtRefreshesMutableClaimsWithoutDuplicateRegistration() {
        Long firstId = provisioning.ensureProvisioned(claims(
                "kc-sub-002", "bob@example.com", "bob", "Bob", "Old", "en", null));
        events.clear();

        Long secondId = provisioning.ensureProvisioned(claims(
                "kc-sub-002", "bob@example.com", "bob", "Bob", "New", "ro", null));

        assertThat(secondId).isEqualTo(firstId);
        assertThat(userDirectory.findById(firstId).orElseThrow().fullName())
                .isEqualTo("Bob New");
        assertThat(events.stream(UserRegistered.class)).isEmpty();
    }

    @Test
    void provisioningPicksUpOrcidFromClaimsAndEmitsLinkEvent() {
        events.clear();

        provisioning.ensureProvisioned(claims(
                "kc-sub-003", "carol@example.com", "carol", "Carol", "Researcher", "en",
                "0000-0002-1825-0097"));

        assertThat(events.stream(OrcidLinked.class))
                .singleElement()
                .satisfies(e -> assertThat(e.orcidId()).isEqualTo("0000-0002-1825-0097"));
    }

    // ------------------------------------------------------------------
    // Role grants
    // ------------------------------------------------------------------

    @Test
    void assigningSectionEditorRequiresAScopeSectionId() {
        Long userId = provisioning.ensureProvisioned(claims(
                "kc-sub-100", "ed@example.com", "ed", "Ed", "Itor", "en", null));

        assertThatThrownBy(() ->
                roleService.assign(userId, Role.SECTION_EDITOR, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("scopeSectionId");
    }

    @Test
    void nonSectionRolesRejectAnyScope() {
        Long userId = provisioning.ensureProvisioned(claims(
                "kc-sub-101", "rev@example.com", "rev", "Rev", "Iewer", "en", null));

        assertThatThrownBy(() ->
                roleService.assign(userId, Role.REVIEWER, 42L, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void duplicateActiveGrantIsRejected() {
        Long userId = provisioning.ensureProvisioned(claims(
                "kc-sub-102", "auth@example.com", "auth", "Auth", "Or", "en", null));
        roleService.assign(userId, Role.AUTHOR, null, null);

        assertThatThrownBy(() ->
                roleService.assign(userId, Role.AUTHOR, null, null))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void assignAndRevokeEmitEvents() {
        Long userId = provisioning.ensureProvisioned(claims(
                "kc-sub-103", "se@example.com", "se", "Section", "Editor", "en", null));
        events.clear();

        roleService.assign(userId, Role.SECTION_EDITOR, 7L, null);
        roleService.revoke(userId, Role.SECTION_EDITOR, 7L);

        assertThat(events.stream(UserRoleAssigned.class))
                .singleElement()
                .satisfies(e -> {
                    assertThat(e.role()).isEqualTo(Role.SECTION_EDITOR);
                    assertThat(e.scopeSectionId()).isEqualTo(7L);
                });
        assertThat(events.stream(UserRoleRevoked.class)).hasSize(1);
        assertThat(roleResolver.activeRolesOf(userId)).doesNotContain(Role.SECTION_EDITOR);
    }

    // ------------------------------------------------------------------
    // Role resolver
    // ------------------------------------------------------------------

    @Test
    void sectionEditorCanEditOnlyAssignedSection() {
        Long userId = provisioning.ensureProvisioned(claims(
                "kc-sub-200", "se2@example.com", "se2", "S", "E", "en", null));
        roleService.assign(userId, Role.SECTION_EDITOR, 10L, null);
        roleService.assign(userId, Role.SECTION_EDITOR, 20L, null);

        assertThat(roleResolver.canEditSection(userId, 10L)).isTrue();
        assertThat(roleResolver.canEditSection(userId, 20L)).isTrue();
        assertThat(roleResolver.canEditSection(userId, 30L)).isFalse();
        assertThat(roleResolver.sectionsEditedBy(userId))
                .containsExactlyInAnyOrder(10L, 20L);
    }

    @Test
    void editorAndAdminCanEditAnySection() {
        Long editorId = provisioning.ensureProvisioned(claims(
                "kc-sub-201", "editor@example.com", "editor", "E", "Itor", "en", null));
        Long adminId = provisioning.ensureProvisioned(claims(
                "kc-sub-202", "admin@example.com", "admin", "A", "Dmin", "en", null));
        roleService.assign(editorId, Role.EDITOR, null, null);
        roleService.assign(adminId, Role.ADMIN, null, null);

        assertThat(roleResolver.canEditSection(editorId, 999L)).isTrue();
        assertThat(roleResolver.canEditSection(adminId, 999L)).isTrue();
    }

    // ------------------------------------------------------------------
    // Directory lookups
    // ------------------------------------------------------------------

    @Test
    void findByIdsReturnsMapKeyedById() {
        Long u1 = provisioning.ensureProvisioned(claims(
                "kc-sub-300", "u1@example.com", "u1", "U", "One", "en", null));
        Long u2 = provisioning.ensureProvisioned(claims(
                "kc-sub-301", "u2@example.com", "u2", "U", "Two", "en", null));

        var byId = userDirectory.findByIds(List.of(u1, u2, 99_999L));

        assertThat(byId).hasSize(2);
        assertThat(byId.get(u1).email()).isEqualTo("u1@example.com");
        assertThat(byId.get(u2).email()).isEqualTo("u2@example.com");
    }

    @Test
    void findActiveWithRoleReturnsOnlyMatchingUsers() {
        Long reviewerId = provisioning.ensureProvisioned(claims(
                "kc-sub-302", "r@example.com", "r", "R", "Eviewer", "en", null));
        Long otherId = provisioning.ensureProvisioned(claims(
                "kc-sub-303", "o@example.com", "o", "O", "Ther", "en", null));
        roleService.assign(reviewerId, Role.REVIEWER, null, null);
        roleService.assign(otherId, Role.AUTHOR, null, null);

        var reviewers = userDirectory.findActiveWithRole(Role.REVIEWER);

        assertThat(reviewers).extracting(s -> s.email()).containsExactly("r@example.com");
    }

    @Test
    void disabledUserExcludedFromActiveWithRole() {
        Long userId = provisioning.ensureProvisioned(claims(
                "kc-sub-304", "d@example.com", "d", "D", "Isabled", "en", null));
        roleService.assign(userId, Role.REVIEWER, null, null);
        userService.setStatus(userId, UserStatus.DISABLED);

        assertThat(userDirectory.findActiveWithRole(Role.REVIEWER))
                .extracting(s -> s.email()).doesNotContain("d@example.com");
    }

    // ------------------------------------------------------------------
    // JWT converter — realm role mapping
    // ------------------------------------------------------------------

    @Test
    void jwtConverterMapsRecognizedRealmRolesToRoleAuthorities() {
        Jwt jwt = stubJwt("kc-sub-400", "auth@example.com",
                Set.of("admin", "reviewer", "ignored-role"));

        var token = jwtConverter.convert(jwt);

        assertThat(token).isNotNull();
        assertThat(authorityNames(token.getAuthorities()))
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_REVIEWER");
    }

    @Test
    void jwtConverterTriggersProvisioningSideEffect() {
        Jwt jwt = stubJwt("kc-sub-401", "viaconverter@example.com", Set.of());

        jwtConverter.convert(jwt);

        assertThat(userDirectory.findByKeycloakSub("kc-sub-401")).isPresent();
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    private static JwtClaims claims(String sub, String email, String username,
                                    String given, String family, String locale,
                                    String orcidId) {
        return new JwtClaims(sub, email, username, given, family, locale, orcidId, Set.of());
    }

    private static Jwt stubJwt(String sub, String email, Set<String> realmRoles) {
        return Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .subject(sub)
                .claim("email", email)
                .claim("preferred_username", email)
                .claim("given_name", "Test")
                .claim("family_name", "User")
                .claim("locale", "en")
                .claim("realm_access", Map.of("roles", List.copyOf(realmRoles)))
                .issuedAt(Instant.now().minusSeconds(60))
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }

    private static List<String> authorityNames(java.util.Collection<? extends GrantedAuthority> auths) {
        return auths.stream().map(GrantedAuthority::getAuthority).toList();
    }
}
