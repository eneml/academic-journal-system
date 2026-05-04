package com.eneml.ajs.shared.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Sliding-window rate limit using Bucket4j token buckets cached in
 * Caffeine. Buckets expire 5 minutes after last use so the cache stays
 * bounded under abuse. Configured by {@link RateLimitProperties}.
 *
 * <p>Designed for in-process operation — single-instance deployments are
 * the target. Multi-instance deployments behind a load balancer should
 * pin the rate-limit decision to the edge (nginx, Cloudflare).
 */
@Component
@ConditionalOnProperty(prefix = "ajs.rate-limit", name = "enabled", havingValue = "true", matchIfMissing = false)
@Slf4j
class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties properties;
    private final Cache<String, Bucket> bucketCache;

    RateLimitFilter(RateLimitProperties properties) {
        this.properties = properties;
        this.bucketCache = Caffeine.newBuilder()
                .expireAfterAccess(5, TimeUnit.MINUTES)
                .maximumSize(50_000)
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        RateLimitProperties.Rule rule = matchRule(request);
        if (rule == null) {
            chain.doFilter(request, response);
            return;
        }
        String key = rule.pathPrefix() + "|" + identityFor(request, rule.keyBy());
        Bucket bucket = bucketCache.get(key, k -> newBucket(rule));
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            chain.doFilter(request, response);
            return;
        }
        long retryAfterSec = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill());
        response.setStatus(429);
        response.setHeader("Retry-After", String.valueOf(Math.max(1, retryAfterSec)));
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Rate limit exceeded\",\"retryAfterSeconds\":"
                + retryAfterSec + "}");
    }

    private RateLimitProperties.Rule matchRule(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        for (RateLimitProperties.Rule rule : properties.rules()) {
            if (rule.pathPrefix() == null) continue;
            if (!uri.startsWith(rule.pathPrefix())) continue;
            if (!rule.methods().isEmpty() && rule.methods().stream()
                    .noneMatch(m -> m.equalsIgnoreCase(method))) continue;
            return rule;
        }
        return null;
    }

    private static String identityFor(HttpServletRequest request, RateLimitProperties.KeyBy keyBy) {
        if (keyBy == RateLimitProperties.KeyBy.USER) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                return "u:" + auth.getName();
            }
        }
        return "ip:" + clientIp(request);
    }

    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return (comma < 0 ? xff : xff.substring(0, comma)).trim();
        }
        return request.getRemoteAddr();
    }

    private static Bucket newBucket(RateLimitProperties.Rule rule) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(rule.capacity())
                .refillGreedy(rule.refillPerMinute(), Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }
}
