/**
 * Scheduling module — cron jobs: reviewer reminders, editorial digest,
 * scheduled-issue publication, search reindex, OAI-PMH sitemap regen.
 *
 * <p>Owns: ScheduledJob, JobExecution.
 * <br>Emits: ReminderDispatched.
 * <br>Consumes: timer-based (no domain events).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Scheduling",
    allowedDependencies = { "shared", "submission::api", "review::api",
                            "editorial::api", "issue::api", "publication::api" }
)
package com.eneml.ajs.scheduling;
