package com.eneml.ajs.identity.api;

import java.util.Set;

/**
 * Snapshot of the identity claims our backend cares about, extracted from
 * a verified Keycloak JWT and handed to {@link UserProvisioning} so the
 * identity module can sync the local {@code app_user} row.
 *
 * @param subject     {@code sub} claim — the stable Keycloak user id
 * @param email       {@code email} claim
 * @param username    {@code preferred_username} claim
 * @param givenName   {@code given_name} claim
 * @param familyName  {@code family_name} claim
 * @param locale      {@code locale} claim, defaulted by the resource server
 * @param orcidId     ORCID iD if Keycloak resolves it as a federated identity
 *                    or via custom mapper; {@code null} otherwise
 * @param realmRoles  realm-level roles from {@code realm_access.roles}
 */
public record JwtClaims(
        String subject,
        String email,
        String username,
        String givenName,
        String familyName,
        String locale,
        String orcidId,
        Set<String> realmRoles
) {
}
