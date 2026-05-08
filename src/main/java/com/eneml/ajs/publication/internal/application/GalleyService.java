package com.eneml.ajs.publication.internal.application;

import com.eneml.ajs.publication.api.GalleyAdded;
import com.eneml.ajs.publication.api.GalleyApproved;
import com.eneml.ajs.publication.internal.domain.Galley;
import com.eneml.ajs.publication.internal.persistence.GalleyRepository;
import com.eneml.ajs.publication.internal.persistence.PublicationRepository;
import com.eneml.ajs.publication.internal.web.dto.GalleyUpsertRequest;
import com.eneml.ajs.publication.internal.web.mapper.GalleyMapper;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GalleyService {

    private final GalleyRepository galleyRepository;
    private final PublicationRepository publicationRepository;
    private final GalleyMapper mapper;
    private final ApplicationEventPublisher events;

    public List<Galley> listForPublication(Long publicationId) {
        return galleyRepository.findByPublicationIdOrderBySeqAscIdAsc(publicationId);
    }

    public Galley get(Long galleyId) {
        return galleyRepository.findById(galleyId).orElseThrow(() ->
                NotFoundException.of("Galley", galleyId));
    }

    @Transactional
    public Galley add(Long publicationId, GalleyUpsertRequest request) {
        if (!publicationRepository.existsById(publicationId)) {
            throw NotFoundException.of("Publication", publicationId);
        }
        if (request.submissionFileId() == null && (request.remoteUrl() == null || request.remoteUrl().isBlank())) {
            throw new ConflictException("Galley needs either submissionFileId or remoteUrl");
        }
        Galley g = mapper.toEntity(request);
        g.setPublicationId(publicationId);
        Galley saved = galleyRepository.save(g);
        events.publishEvent(GalleyAdded.of(saved.getId(), publicationId));
        return saved;
    }

    @Transactional
    public Galley update(Long publicationId, Long galleyId, GalleyUpsertRequest request) {
        Galley g = get(galleyId);
        if (!g.getPublicationId().equals(publicationId)) {
            throw NotFoundException.of("Galley on publication " + publicationId, galleyId);
        }
        mapper.applyUpdate(request, g);
        return g;
    }

    @Transactional
    public Galley approve(Long publicationId, Long galleyId, Long publisherUserId) {
        Galley g = get(galleyId);
        if (!g.getPublicationId().equals(publicationId)) {
            throw NotFoundException.of("Galley on publication " + publicationId, galleyId);
        }
        if (g.isApproved()) return g;
        g.approve(publisherUserId);
        events.publishEvent(GalleyApproved.of(galleyId, publicationId));
        return g;
    }

    @Transactional
    public Galley unapprove(Long publicationId, Long galleyId) {
        Galley g = get(galleyId);
        if (!g.getPublicationId().equals(publicationId)) {
            throw NotFoundException.of("Galley on publication " + publicationId, galleyId);
        }
        g.unapprove();
        return g;
    }

    @Transactional
    public void remove(Long publicationId, Long galleyId) {
        Galley g = get(galleyId);
        if (!g.getPublicationId().equals(publicationId)) {
            throw NotFoundException.of("Galley on publication " + publicationId, galleyId);
        }
        galleyRepository.delete(g);
    }
}
