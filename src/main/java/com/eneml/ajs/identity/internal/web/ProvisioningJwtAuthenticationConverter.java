package com.eneml.ajs.identity.internal.web;

import com.eneml.ajs.identity.api.JwtClaims;
import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.UserProvisioning;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Converts a verified Keycloak JWT into a Spring Security
 * {@link AbstractAuthenticationToken}, mapping realm roles to
 * {@code ROLE_*} authorities and triggering lazy provisioning of a local
 * {@code app_user} via {@link UserProvisioning}.
 */
@Component
@RequiredArgsConstructor
class ProvisioningJwtAuthenticationConverter
        implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final Set<String> RECOGNIZED_ROLES = java.util.Arrays.stream(Role.values())
            .map(Enum::name)
            .collect(Collectors.toUnmodifiableSet());

    private final UserProvisioning provisioning;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        JwtClaims claims = toClaims(jwt);
        provisioning.ensureProvisioned(claims);
        Collection<GrantedAuthority> authorities = mapAuthorities(claims.realmRoles());
        return new JwtAuthenticationToken(jwt, authorities, claims.subject());
    }

    private static JwtClaims toClaims(Jwt jwt) {
        return new JwtClaims(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                jwt.getClaimAsString("preferred_username"),
                jwt.getClaimAsString("given_name"),
                jwt.getClaimAsString("family_name"),
                jwt.getClaimAsString("locale"),
                jwt.getClaimAsString("orcid"),
                extractRealmRoles(jwt));
    }

    @SuppressWarnings("unchecked")
    private static Set<String> extractRealmRoles(Jwt jwt) {
        Object realmAccess = jwt.getClaim("realm_access");
        if (!(realmAccess instanceof Map<?, ?> map)) {
            return Set.of();
        }
        Object roles = map.get("roles");
        if (!(roles instanceof Collection<?> collection)) {
            return Set.of();
        }
        return ((Collection<String>) collection).stream()
                .filter(java.util.Objects::nonNull)
                .map(role -> role.toUpperCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
    }

    private static Collection<GrantedAuthority> mapAuthorities(Set<String> realmRoles) {
        if (realmRoles.isEmpty()) {
            return List.of();
        }
        return realmRoles.stream()
                .filter(RECOGNIZED_ROLES::contains)
                .map(role -> "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toUnmodifiableSet());
    }
}
