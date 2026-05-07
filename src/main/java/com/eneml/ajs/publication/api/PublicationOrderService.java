package com.eneml.ajs.publication.api;

import java.util.List;

/**
 * Mutating API surface for adjusting publication-to-issue ordering — used by
 * the editor issue-curation screen. The reorder operation is atomic per issue:
 * the supplied list defines the new dense [0..n) display order for the rows
 * that belong to the given issue. Publications not in the list are not touched.
 */
public interface PublicationOrderService {

    /**
     * Apply a new display order for an issue. Validates that every id in the
     * list belongs to the given issue; throws {@link IllegalArgumentException}
     * otherwise so the caller can surface a 400. The persisted display_order
     * values are 0, 1, 2, … in array order.
     */
    void reorderInIssue(Long issueId, List<Long> orderedPublicationIds);

    /**
     * Move a single publication to a different section within the same issue.
     * The article's display_order is appended at the end of the target section.
     */
    void moveToSection(Long publicationId, Long targetSectionId);
}
