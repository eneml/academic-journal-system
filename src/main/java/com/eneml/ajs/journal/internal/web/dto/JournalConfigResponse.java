package com.eneml.ajs.journal.internal.web.dto;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

public record JournalConfigResponse(
        Map<String, String> name,
        String issnPrint,
        String issnOnline,
        String defaultLocale,
        Set<String> supportedLocales,
        String contactEmail,
        Map<String, String> mastheadText,
        Map<String, String> copyrightNotice,
        String licenseUrl,
        Map<String, String> about,
        boolean submissionsOpen,
        String acronym,
        Map<String, String> subtitle,
        Integer foundingYear,
        String frequency,
        String publisher,
        String countryOfPublication,
        String tagline,
        String taglineOrnament,
        long version,
        Instant updatedAt
) {
}
