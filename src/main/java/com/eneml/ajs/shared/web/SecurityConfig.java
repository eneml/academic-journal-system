package com.eneml.ajs.shared.web;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Stateless OAuth2 resource server. The {@link Converter} bean is supplied
 * by another module (the identity module) and handles realm-role mapping
 * plus lazy provisioning of local users.
 *
 * <p>CORS is wired here using the {@code app.cors.*} block from
 * {@code application.yml} so the SPA origins (public site + editorial app)
 * can call the API in the browser. {@code OPTIONS} requests are explicitly
 * permitted in the security chain so the CORS preflight isn't intercepted
 * by the resource-server JWT filter and rejected with 401.
 */
@Configuration
@EnableMethodSecurity
class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(
            HttpSecurity http,
            Converter<Jwt, AbstractAuthenticationToken> jwtConverter,
            CorsConfigurationSource corsConfigurationSource) throws Exception {
        return http
                .cors(c -> c.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // CORS preflight has no Authorization header by design — let it through
                        // so the resource server doesn't reject it with 401 before the CORS
                        // filter can answer.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Spring Boot forwards uncaught exceptions to /error before the
                        // response is rendered. Without this, the resource-server filter
                        // sees the forward as an unauthenticated request and masks any
                        // real 500 with a misleading 401 + WWW-Authenticate: Bearer.
                        .requestMatchers("/error").permitAll()
                        // Public self-registration — anonymous users POST credentials
                        // here to create their Keycloak account before signing in.
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/journal/config",
                                "/api/v1/journal/sections",
                                "/api/v1/journal/sections/**",
                                "/api/v1/journal/genres",
                                "/api/v1/journal/genres/**",
                                "/api/v1/journal/masthead",
                                "/api/v1/issues",
                                "/api/v1/issues/**",
                                "/api/v1/publications/recent",
                                "/api/v1/publications/*/metrics",
                                "/api/v1/metrics/**",
                                "/api/v1/articles/**",
                                "/api/v1/search",
                                // Public-site reads — used by homepage announcement strip,
                                // /announcements page, /sections/[code], /authors/[orcid].
                                // Mutating endpoints (/announcements POST/PUT/DELETE,
                                // /users) stay protected via the controller-level
                                // @PreAuthorize since only the GET method is permitted here.
                                "/api/v1/announcements",
                                "/api/v1/announcements/*",
                                "/api/v1/sections/*/publications",
                                "/api/v1/authors/*",
                                "/api/v1/categories",
                                "/api/v1/categories/*",
                                "/api/v1/categories/by-path/**",
                                "/api/v1/categories/*/publications",
                                "/api/v1/publications/*/categories",
                                "/api/v1/articles/*/recommendations/by-author",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/actuator/health",
                                "/actuator/info",
                                "/actuator/prometheus")
                        .permitAll()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwtConverter)))
                .build();
    }

    /**
     * CORS source built from {@code app.cors.*} YAML. The default values
     * mirror the local-dev compose stack (public site on :3000, editorial
     * app on :5173) so it works out of the box without env vars.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
                    List<String> allowedOrigins,
            @Value("${app.cors.allowed-methods:GET,POST,PUT,PATCH,DELETE,OPTIONS}")
                    String allowedMethods,
            @Value("${app.cors.allowed-headers:*}") String allowedHeaders,
            @Value("${app.cors.allow-credentials:true}") boolean allowCredentials,
            @Value("${app.cors.max-age:3600}") long maxAge) {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(allowedOrigins);
        cfg.setAllowedMethods(Arrays.stream(allowedMethods.split(",")).map(String::trim).toList());
        if ("*".equals(allowedHeaders.trim())) {
            cfg.addAllowedHeader("*");
        } else {
            cfg.setAllowedHeaders(Arrays.stream(allowedHeaders.split(",")).map(String::trim).toList());
        }
        // Expose Location so client-side flows that follow created resources
        // can read where the new entity lives.
        cfg.setExposedHeaders(List.of("Location", "Content-Disposition"));
        cfg.setAllowCredentials(allowCredentials);
        cfg.setMaxAge(maxAge);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
