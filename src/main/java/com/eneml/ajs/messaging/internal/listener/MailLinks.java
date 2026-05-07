package com.eneml.ajs.messaging.internal.listener;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Single source of truth for absolute URLs handed to email templates. The
 * action-link the user clicks in mail must work outside the SPA, so listeners
 * resolve relative paths through this bean before stuffing them into Mustache
 * variables.
 */
@Component
class MailLinks {

    private final String editorialBase;
    private final String publicBase;

    MailLinks(@Value("${app.editorial-app-url:http://localhost:5173}") String editorialBase,
              @Value("${app.public-site-url:http://localhost:3000}") String publicBase) {
        this.editorialBase = strip(editorialBase);
        this.publicBase = strip(publicBase);
    }

    String editor(String relativePath) {
        return editorialBase + slashed(relativePath);
    }

    String publicSite(String relativePath) {
        return publicBase + slashed(relativePath);
    }

    String editorialBase() {
        return editorialBase;
    }

    String publicBase() {
        return publicBase;
    }

    private static String strip(String s) {
        if (s == null) return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    private static String slashed(String s) {
        if (s == null || s.isBlank()) return "";
        return s.startsWith("/") ? s : "/" + s;
    }
}
