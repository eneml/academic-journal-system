package com.eneml.ajs.identity.api;

/**
 * Lightweight user projection returned by {@link UserDirectoryService} to
 * other modules. Holds only fields a consumer can be expected to need —
 * heavier profile data stays inside the identity module.
 */
public record UserSummary(
        Long id,
        String email,
        String givenName,
        String familyName,
        String orcidId,
        UserStatus status,
        String locale
) {

    public String fullName() {
        if (givenName == null && familyName == null) return email;
        if (givenName == null) return familyName;
        if (familyName == null) return givenName;
        return givenName + " " + familyName;
    }
}
