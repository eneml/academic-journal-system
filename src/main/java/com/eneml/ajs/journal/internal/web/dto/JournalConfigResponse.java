package com.eneml.ajs.journal.internal.web.dto;

import com.eneml.ajs.journal.internal.domain.JournalConfig.ChecklistItem;

import java.time.Instant;
import java.util.List;
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
        Map<String, String> privacyStatement,
        Map<String, String> competingInterestsPolicy,
        List<ChecklistItem> submissionChecklist,
        long version,
        Instant updatedAt
) {
}
