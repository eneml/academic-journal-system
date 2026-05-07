package com.eneml.ajs.identity.internal.web.dto;

import jakarta.validation.constraints.Size;

/**
 * Partial-update body for {@code PATCH /api/v1/users/me/preferences}. Each
 * field is optional — null means "leave unchanged". Today this only carries
 * the locale (used by the {@code LanguageSwitcher} to persist the choice on
 * the user record), but the shape is intentionally extensible.
 */
public record UserPreferencesPatch(
        @Size(min = 2, max = 8)
        String locale
) {
}
