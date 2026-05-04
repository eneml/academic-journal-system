package com.eneml.ajs.issue.api;

import com.eneml.ajs.publication.api.AccessStatus;

import java.time.Instant;
import java.util.Map;

public record IssueSummary(
        Long id,
        Integer volume,
        String number,
        Integer year,
        Map<String, String> title,
        String urlPath,
        boolean published,
        Instant datePublished,
        AccessStatus accessStatus
) {

    /** Human-readable identification: "Vol. 12 No. 3 (2026)". */
    public String identification() {
        StringBuilder sb = new StringBuilder();
        if (volume != null) sb.append("Vol. ").append(volume);
        if (number != null) {
            if (sb.length() > 0) sb.append(' ');
            sb.append("No. ").append(number);
        }
        if (year != null) {
            if (sb.length() > 0) sb.append(' ');
            sb.append('(').append(year).append(')');
        }
        return sb.length() == 0 ? "Issue " + id : sb.toString();
    }
}
