package com.eneml.ajs.identity.api;

/**
 * Hook invoked by the JWT authentication converter on every authenticated
 * request. Creates the local {@code app_user} on first sight and refreshes
 * mutable identity claims (email, name, locale, last-login) on subsequent
 * requests.
 */
public interface UserProvisioning {

    /**
     * @return the local user id matching the given JWT claims
     */
    Long ensureProvisioned(JwtClaims claims);
}
