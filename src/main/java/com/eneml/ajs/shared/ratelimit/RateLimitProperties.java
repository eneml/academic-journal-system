package com.eneml.ajs.shared.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Rate-limit rules. Each rule applies to requests whose URI matches
 * {@code pathPrefix} and method is in {@code methods} (or to all methods
 * if {@code methods} is empty). Buckets are keyed per {@code keyBy}:
 *
 * <ul>
 *   <li>{@code IP} — one bucket per remote address. Right for unauthenticated abuse vectors.</li>
 *   <li>{@code USER} — one bucket per JWT subject; falls back to IP if anonymous.</li>
 * </ul>
 */
@ConfigurationProperties(prefix = "ajs.rate-limit")
public record RateLimitProperties(
        boolean enabled,
        List<Rule> rules
) {

    public RateLimitProperties {
        if (rules == null) rules = List.of();
    }

    public record Rule(
            String pathPrefix,
            List<String> methods,
            KeyBy keyBy,
            int capacity,
            int refillPerMinute
    ) {
        public Rule {
            if (methods == null) methods = List.of();
            if (keyBy == null) keyBy = KeyBy.IP;
            if (capacity <= 0) capacity = 30;
            if (refillPerMinute <= 0) refillPerMinute = capacity;
        }
    }

    public enum KeyBy { IP, USER }
}
