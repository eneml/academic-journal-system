package com.eneml.ajs.messaging.internal.application.template;

/**
 * Result of rendering one templated email — the locale that actually resolved
 * (after fallback), plus the substituted subject and body. The body is plain
 * text / Markdown; HTML wrapping happens later in {@code MailService}.
 */
public record RenderedEmail(String locale, String subject, String body) {}
