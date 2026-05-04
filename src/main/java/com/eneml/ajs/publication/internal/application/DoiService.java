package com.eneml.ajs.publication.internal.application;

import com.eneml.ajs.publication.api.DoiAssigned;
import com.eneml.ajs.publication.internal.domain.Doi;
import com.eneml.ajs.publication.internal.domain.Galley;
import com.eneml.ajs.publication.internal.domain.Publication;
import com.eneml.ajs.publication.internal.persistence.DoiRepository;
import com.eneml.ajs.publication.internal.persistence.GalleyRepository;
import com.eneml.ajs.publication.internal.persistence.PublicationRepository;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DoiService {

    private final DoiRepository doiRepository;
    private final PublicationRepository publicationRepository;
    private final GalleyRepository galleyRepository;
    private final ApplicationEventPublisher events;

    public Doi get(Long id) {
        return doiRepository.findById(id).orElseThrow(() ->
                NotFoundException.of("Doi", id));
    }

    @Transactional
    public Doi assignToPublication(Long publicationId, String doi) {
        Publication p = publicationRepository.findById(publicationId).orElseThrow(() ->
                NotFoundException.of("Publication", publicationId));
        Doi assigned = ensureDoi(doi);
        if (p.getDoiId() != null && !p.getDoiId().equals(assigned.getId())) {
            throw new ConflictException("Publication %d already has DOI assigned"
                    .formatted(publicationId));
        }
        p.setDoiId(assigned.getId());
        events.publishEvent(DoiAssigned.of(assigned.getId(), assigned.getDoi(),
                "publication", publicationId));
        return assigned;
    }

    @Transactional
    public Doi assignToGalley(Long galleyId, String doi) {
        Galley g = galleyRepository.findById(galleyId).orElseThrow(() ->
                NotFoundException.of("Galley", galleyId));
        Doi assigned = ensureDoi(doi);
        if (g.getDoiId() != null && !g.getDoiId().equals(assigned.getId())) {
            throw new ConflictException("Galley %d already has DOI assigned".formatted(galleyId));
        }
        g.setDoiId(assigned.getId());
        events.publishEvent(DoiAssigned.of(assigned.getId(), assigned.getDoi(),
                "galley", galleyId));
        return assigned;
    }

    private Doi ensureDoi(String doi) {
        return doiRepository.findByDoi(doi).orElseGet(() -> {
            Doi created = new Doi();
            created.setDoi(doi);
            return doiRepository.save(created);
        });
    }
}
