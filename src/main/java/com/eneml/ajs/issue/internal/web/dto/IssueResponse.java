package com.eneml.ajs.issue.internal.web.dto;

import com.eneml.ajs.publication.api.AccessStatus;

import java.time.Instant;
import java.util.Map;

/**
 * Wire representation of an issue.
 *
 * <p>{@code coverImagePath} is the legacy external URL field (kept for
 * back-compat). {@code coverImageUrl} is the resolved download URL the
 * client should actually render — populated from
 * {@link #coverImagePath} when only a legacy URL exists, or from a
 * server-minted presigned URL when {@code cover_file_id} is set.
 */
public record IssueResponse(
        Long id,
        Integer volume,
        String number,
        Integer year,
        Map<String, String> title,
        Map<String, String> description,
        String coverImagePath,
        String coverImageUrl,
        Long coverFileId,
        String urlPath,
        boolean showVolume,
        boolean showNumber,
        boolean showYear,
        boolean showTitle,
        boolean published,
        Instant datePublished,
        AccessStatus accessStatus,
        Instant openAccessDate,
        long version,
        Instant updatedAt
) {
}
