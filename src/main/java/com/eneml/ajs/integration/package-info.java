/**
 * Integration module — outbound integrations: CrossRef DOI deposit,
 * ORCID work push, OAI-PMH provider, JATS XML rendition.
 *
 * <p>Owns: IntegrationCredentials (config only).
 * <br>Emits: DoiRegistered, OrcidWorkPushed, OaiHarvestServed.
 * <br>Consumes: PublicationPublished, DoiAssigned.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Integration",
    allowedDependencies = { "shared", "publication::api", "issue::api",
                            "journal::api", "identity::api" }
)
package com.eneml.ajs.integration;
