package com.eneml.ajs.editorial.api;

/**
 * Roles a user can hold on a submission's stage. Distinct from
 * {@code identity.api.Role} (which is a system-wide grant) — a person
 * who is an EDITOR globally may participate as AUTHOR on their own
 * submission, for example. Reviewers are tracked separately in
 * {@code review.api} per round and do not appear here.
 */
public enum StageRole {
    EDITOR,
    SECTION_EDITOR,
    AUTHOR,
    PRODUCTION_STAFF
}
