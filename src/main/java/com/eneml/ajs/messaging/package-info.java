/**
 * Messaging module — in-app notifications, email templates, mailables,
 * email log. Pure consumer of domain events from other modules.
 *
 * <p>Owns: Notification, NotificationSubscription, EmailTemplate, EmailLog.
 * <br>Emits: NotificationCreated, EmailSent.
 * <br>Consumes: nearly every major domain event (SubmissionSubmitted,
 * ReviewerInvited, ReviewSubmitted, DecisionMade, PublicationPublished, ...).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Messaging",
    allowedDependencies = { "shared", "identity::api", "submission::api",
                            "review::api", "editorial::api", "publication::api",
                            "issue::api", "journal::api" }
)
package com.eneml.ajs.messaging;
