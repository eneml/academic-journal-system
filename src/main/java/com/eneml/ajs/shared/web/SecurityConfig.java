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
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Stateless OAuth2 resource server. The {@link Converter} bean is supplied
 * by another module (the identity module) and handles realm-role mapping
 * plus lazy provisioning of local users.
 */
@Configuration
@EnableMethodSecurity
class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(
            HttpSecurity http,
            Converter<Jwt, AbstractAuthenticationToken> jwtConverter) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
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
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwtConverter)))
                .build();
    }
}
