package com.eneml.ajs.identity.internal.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Backend admin credentials for Keycloak. Used by the registration endpoint
 * to create users in the application realm. In dev we authenticate against
 * the master realm with the bootstrap admin; in production this should be
 * replaced by a confidential client + service-account that holds only the
 * realm-management/manage-users role.
 */
@ConfigurationProperties(prefix = "app.keycloak.admin")
public record KeycloakAdminProperties(
        String url,
        Master master,
        String targetRealm,
        String defaultRole
) {
    public record Master(
            String clientId,
            String username,
            String password
    ) {
    }
}
