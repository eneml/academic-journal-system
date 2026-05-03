package com.eneml.ajs.shared.web;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Stateless OAuth2 resource server. Validates Keycloak JWTs and maps Keycloak
 * realm roles to Spring Security {@code ROLE_*} authorities so {@code @PreAuthorize}
 * can use {@code hasRole('ADMIN')}, {@code hasAuthority('ROLE_EDITOR')}, etc.
 *
 * <p>Public endpoints: read-only catalogue and metadata that the public reading
 * site needs without auth (config, sections, genres, masthead). Everything
 * else requires a valid bearer token.
 */
@Configuration
@EnableMethodSecurity
class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> { /* CorsFilter is supplied via app.cors.* properties */ })
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/journal/config",
                                "/api/v1/journal/sections",
                                "/api/v1/journal/sections/**",
                                "/api/v1/journal/genres",
                                "/api/v1/journal/genres/**",
                                "/api/v1/journal/masthead",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/actuator/health",
                                "/actuator/info",
                                "/actuator/prometheus")
                        .permitAll()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwtConverter())))
                .build();
    }

    private Converter<Jwt, AbstractAuthenticationToken> jwtConverter() {
        var converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(SecurityConfig::authoritiesOf);
        return converter;
    }

    @SuppressWarnings("unchecked")
    private static Collection<GrantedAuthority> authoritiesOf(Jwt jwt) {
        var scopeAuthorities = new JwtGrantedAuthoritiesConverter().convert(jwt);
        var realm = (Map<String, Object>) jwt.getClaims().getOrDefault("realm_access", Map.of());
        var realmRoles = ((Collection<String>) realm.getOrDefault("roles", List.of())).stream()
                .map(role -> "ROLE_" + role.toUpperCase(Locale.ROOT))
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority.class::cast);
        return Stream.concat(
                        scopeAuthorities == null ? Stream.empty() : scopeAuthorities.stream(),
                        realmRoles)
                .distinct()
                .toList();
    }
}
