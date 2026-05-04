/**
 * Integration module — outbound metadata exchange with external academic
 * services. Generates JATS XML for a published rendition, will deposit
 * DOI metadata to CrossRef, and push work records to authors' ORCID
 * profiles. Each outbound attempt is tracked in {@code deposit_record}
 * so failures can be retried and successes audited.
 *
 * <p>Owns: DepositRecord.
 * <br>Emits: DepositSent, DepositFailed (planned).
 * <br>Consumes: PublicationPublished, DoiAssigned (planned).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Integration",
    allowedDependencies = {
        "shared",
        "publication::api",
        "issue::api",
        "submission::api",
        "journal::api",
        "identity::api"
    }
)
package com.eneml.ajs.integration;
