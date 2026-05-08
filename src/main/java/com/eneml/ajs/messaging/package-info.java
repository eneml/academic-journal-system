/**
 * Messaging module — in-app notifications + outbound email. Each persisted
 * Notification can fan out to a templated email (Thymeleaf) sent via
 * {@code spring-boot-starter-mail}; SMTP failures are logged but never
 * roll back the in-app record so the user always sees the alert.
 *
 * <p>Owns: Notification.
 * <br>Emits: NotificationCreated.
 * <br>Consumes: SubmissionSubmitted, DecisionMade, ReviewerInvited,
 *               NotificationCreated (self, for email fanout).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Messaging",
    allowedDependencies = { "shared", "identity::api", "submission::api",
                            "review::api", "editorial::api", "publication::api",
                            "issue::api", "journal::api", "discussion::api",
                            "scheduling::api", "invitation::api" }
)
package com.eneml.ajs.messaging;
