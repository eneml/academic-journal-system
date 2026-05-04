package com.eneml.ajs.search.internal.application;

import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationPublished;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.publication.api.PublicationUnpublished;
import com.eneml.ajs.search.internal.persistence.SearchIndexRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;

/**
 * Maintains the {@code published_search_index} table by reacting to
 * publication lifecycle events. Tolerates missing data — if the
 * publication can't be looked up at the time the listener fires, we
 * skip and let an eventual reconciliation job pick it up later.
 */
@Service
@RequiredArgsConstructor
@Slf4j
class SearchIndexService {

    private final SearchIndexRepository repository;
    private final PublicationLookup publications;

    @ApplicationModuleListener
    void on(PublicationPublished event) {
        var publication = publications.findById(event.publicationId()).orElse(null);
        if (publication == null) {
            log.warn("PublicationPublished for missing publication id={}", event.publicationId());
            return;
        }
        upsert(publication);
    }

    @ApplicationModuleListener
    void on(PublicationUnpublished event) {
        repository.deleteById(event.publicationId());
    }

    void upsert(PublicationSummary publication) {
        Integer year = publication.datePublished() == null
                ? null
                : publication.datePublished().atZone(ZoneOffset.UTC).getYear();
        repository.upsert(
                publication.id(),
                publication.submissionId(),
                publication.sectionId(),
                publication.issueId(),
                year,
                publication.locale(),
                joinValues(publication.title()),
                joinValues(publication.abstractText()),
                String.join(" ", publication.keywords()),
                publication.datePublished());
    }

    private static String joinValues(Map<String, String> localized) {
        if (localized == null || localized.isEmpty()) return "";
        return String.join(" ", localized.values());
    }
}
