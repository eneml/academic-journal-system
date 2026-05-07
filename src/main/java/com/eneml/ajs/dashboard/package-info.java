/**
 * Dashboard module — read-only aggregation of editorial KPIs for the admin
 * Statistics page. Composes counts from submission, editorial, review, and
 * publication via their public Lookup APIs; owns no entities of its own.
 *
 * <p>Owns: nothing.
 * <br>Emits: nothing.
 * <br>Consumes: submission::api, editorial::api, review::api, publication::api, metrics::api.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Dashboard",
    allowedDependencies = {
        "shared",
        "submission::api",
        "editorial::api",
        "review::api",
        "publication::api",
        "metrics::api"
    }
)
package com.eneml.ajs.dashboard;
