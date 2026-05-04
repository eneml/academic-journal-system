/**
 * Scheduling module — cron-driven sweeps that emit domain events for
 * downstream listeners (messaging, integration). Currently runs the
 * reviewer reminder pass; editorial digest and scheduled-issue
 * publication land in follow-up commits.
 *
 * <p>Owns: nothing.
 * <br>Emits: ReviewerReminderDue.
 * <br>Consumes: timer-based (no domain events).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Scheduling",
    allowedDependencies = { "shared", "submission::api", "review::api",
                            "editorial::api", "issue::api", "publication::api" }
)
package com.eneml.ajs.scheduling;
