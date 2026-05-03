/**
 * Identity module — users, roles, user-groups, profile, ORCID linking.
 *
 * <p>Owns: User, Role, UserGroup, UserGroupAssignment, OrcidLink.
 * <br>Emits: UserRegistered, UserActivated, UserDisabled,
 * UserGroupAssigned, OrcidLinked.
 * <br>Consumes: nothing (root of the dependency graph).
 *
 * <p>Public API package: {@code com.eneml.ajs.identity.api}
 * exposes lightweight read DTOs and lookup services for other modules.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Identity"
)
package com.eneml.ajs.identity;
