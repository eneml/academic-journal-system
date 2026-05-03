/**
 * Identity module — local user accounts (lazy-provisioned from Keycloak
 * JWTs), role grants, and the JWT authentication converter that maps
 * realm roles into Spring Security authorities.
 *
 * <p>Owns: User, UserRoleAssignment.
 * <br>Emits: UserRegistered, UserActivated, UserDisabled, UserRoleAssigned,
 * UserRoleRevoked, OrcidLinked.
 * <br>Consumes: nothing (root of the dependency graph).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Identity"
)
package com.eneml.ajs.identity;
