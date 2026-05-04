package com.eneml.ajs.journal.api;

import java.util.Map;
import java.util.Set;

/**
 * Read-only projection of the singleton journal configuration that other
 * modules may need (e.g. the messaging module embedding the journal name
 * in email subjects, the integration module emitting CrossRef metadata).
 *
 * @param name              localized journal name keyed by BCP-47 tag
 * @param defaultLocale     fallback locale when a translation is missing
 * @param supportedLocales  locales this journal publishes in
 * @param contactEmail      address shown on the public site / used as Reply-To
 * @param issnPrint         ISSN of the print edition (XXXX-XXXX), nullable
 * @param issnOnline        ISSN of the electronic edition (XXXX-XXXX), nullable
 * @param submissionsOpen   whether the submission form is currently accepting work
 */
public record JournalConfigSummary(
        Map<String, String> name,
        String defaultLocale,
        Set<String> supportedLocales,
        String contactEmail,
        String issnPrint,
        String issnOnline,
        boolean submissionsOpen
) {
}
