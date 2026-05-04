package com.eneml.ajs.publication.internal.application;

import com.eneml.ajs.publication.api.GalleyLookup;
import com.eneml.ajs.publication.api.GalleySummary;
import com.eneml.ajs.publication.internal.persistence.GalleyRepository;
import com.eneml.ajs.publication.internal.web.mapper.GalleyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class GalleyLookupAdapter implements GalleyLookup {

    private final GalleyRepository repository;
    private final GalleyMapper mapper;

    @Override
    public List<GalleySummary> galleysOfPublication(Long publicationId) {
        return mapper.toSummaries(repository.findByPublicationIdOrderBySeqAscIdAsc(publicationId));
    }

    @Override
    public List<GalleySummary> approvedGalleysOfPublication(Long publicationId) {
        return mapper.toSummaries(
                repository.findByPublicationIdAndApprovedTrueOrderBySeqAscIdAsc(publicationId));
    }

    @Override
    public Optional<GalleySummary> findById(Long galleyId) {
        return repository.findById(galleyId).map(mapper::toSummary);
    }
}
