package com.eneml.ajs.journal.api;

import java.util.Map;

/**
 * Read-only projection of a journal section. Returned by {@link SectionLookup}
 * to other modules (e.g. submission module validating that a manuscript's
 * target section exists and is active).
 */
public record SectionSummary(
        Long id,
        String code,
        int seq,
        Map<String, String> title,
        Map<String, String> abbrev,
        boolean inactive,
        boolean editorRestricted,
        boolean abstractsRequired,
        Long reviewFormId
) {
}
