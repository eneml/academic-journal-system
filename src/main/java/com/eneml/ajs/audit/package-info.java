/**
 * Audit module — append-only event log per submission/user. Pure consumer.
 *
 * <p>Owns: EventLogEntry.
 * <br>Emits: nothing.
 * <br>Consumes: every major domain event (write-only sink for compliance).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Audit",
    allowedDependencies = { "shared", "identity::api" }
)
package com.eneml.ajs.audit;
