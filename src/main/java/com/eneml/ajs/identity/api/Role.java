package com.eneml.ajs.identity.api;

/**
 * Application-level roles. Spring Security authorities use the form
 * {@code ROLE_<NAME>} (e.g. {@code ROLE_ADMIN}); JWT realm roles from
 * Keycloak are mapped to those at authentication time.
 */
public enum Role {
    ADMIN,
    EDITOR,
    SECTION_EDITOR,
    AUTHOR,
    REVIEWER,
    PRODUCTION_STAFF;

    public String authority() {
        return "ROLE_" + name();
    }
}
