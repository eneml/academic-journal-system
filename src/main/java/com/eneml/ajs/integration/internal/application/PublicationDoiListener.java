package com.eneml.ajs.integration.internal.application;

import com.eneml.ajs.integration.api.DepositSubject;
import com.eneml.ajs.integration.api.DepositTarget;
import com.eneml.ajs.publication.api.DoiAssigned;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationPublished;
import com.eneml.ajs.publication.api.PublicationStatus;
import com.eneml.ajs.publication.api.PublicationSummary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Bridges publication-side events into outbound deposit work. Whenever a
 * publication acquires both a PUBLISHED status and a DOI, we enqueue a
 * CrossRef deposit. The scheduled worker picks it up on the next tick.
 *
 * <p>Re-entry is fine — the dispatcher transitions a row out of PENDING
 * before sending, and we simply create a fresh PENDING row for any new
 * round-trip the user wants (e.g. metadata corrections to a v2).
 */
@Component
@RequiredArgsConstructor
@Slf4j
class PublicationDoiListener {

    private final DepositService depositService;
    private final PublicationLookup publicationLookup;
    private final IntegrationProperties properties;

    @ApplicationModuleListener
    void onPublished(PublicationPublished event) {
        publicationLookup.findById(event.publicationId())
                .filter(p -> p.doiId() != null)
                .ifPresent(this::enqueueAll);
    }

    @ApplicationModuleListener
    void onDoiAssigned(DoiAssigned event) {
        if (!"publication".equalsIgnoreCase(event.assocType())) return;
        publicationLookup.findById(event.assocId())
                .filter(p -> p.status() == PublicationStatus.PUBLISHED)
                .ifPresent(this::enqueueAll);
    }

    private void enqueueAll(PublicationSummary publication) {
        if (properties.crossref().enabled()) {
            depositService.enqueue(DepositTarget.CROSSREF,
                    DepositSubject.PUBLICATION, publication.id());
        }
        if (properties.orcid().enabled()) {
            // One deposit per author whose ORCID account is linked + has stored
            // OAuth credentials. The dispatcher routes each row to that
            // author's bearer token when the work record is pushed.
            for (Long actorUserId : depositService.linkedAuthorsFor(publication.id())) {
                depositService.enqueue(DepositTarget.ORCID,
                        DepositSubject.PUBLICATION, publication.id(), actorUserId);
            }
        }
        if (properties.doaj().enabled()) {
            depositService.enqueue(DepositTarget.DOAJ,
                    DepositSubject.PUBLICATION, publication.id());
        }
    }
}
