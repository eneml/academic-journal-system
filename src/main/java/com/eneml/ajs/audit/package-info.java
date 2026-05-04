/**
 * Audit module — append-only event log. Pure consumer of domain events
 * across the whole system; nothing reads back into other modules.
 *
 * <p>Owns: EventLogEntry.
 * <br>Emits: nothing.
 * <br>Consumes: every major domain event (write-only sink for compliance).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Audit",
    allowedDependencies = { "shared", "identity::api", "submission::api",
                            "review::api", "editorial::api",
                            "publication::api", "issue::api" }
)
package com.eneml.ajs.audit;
