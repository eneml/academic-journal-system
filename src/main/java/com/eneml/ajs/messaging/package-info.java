/**
 * Messaging module — in-app notifications. Pure consumer of domain
 * events from other modules; email delivery + templates ship in a
 * follow-up phase.
 *
 * <p>Owns: Notification.
 * <br>Emits: NotificationCreated.
 * <br>Consumes: SubmissionSubmitted, DecisionMade, ReviewerInvited.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Messaging",
    allowedDependencies = { "shared", "identity::api", "submission::api",
                            "review::api", "editorial::api", "publication::api",
                            "issue::api", "journal::api" }
)
package com.eneml.ajs.messaging;
