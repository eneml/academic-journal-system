package com.eneml.ajs.dashboard.api;

/**
 * One row of the "Submissions by section" card on the admin Statistics page.
 *
 * @param sectionId       primary identifier
 * @param code            short code (e.g. "ART", "REV")
 * @param title           localized title in the admin user's locale
 * @param submissions     submissions received in the inspected window
 * @param accepted        ACCEPT decisions issued in the window for this section
 * @param declined        DECLINE / INITIAL_DECLINE decisions in the window
 * @param acceptanceRatePct accepted / (accepted + declined), 0 if no decisions
 */
public record SectionStatsRow(
        long sectionId,
        String code,
        String title,
        long submissions,
        long accepted,
        long declined,
        int acceptanceRatePct
) {
}
