package com.eneml.ajs.publication.internal.application;

import com.eneml.ajs.publication.api.DoiLookup;
import com.eneml.ajs.publication.api.DoiSummary;
import com.eneml.ajs.publication.internal.domain.Doi;
import com.eneml.ajs.publication.internal.persistence.DoiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class DoiLookupAdapter implements DoiLookup {

    private final DoiRepository repository;

    @Override
    public Optional<DoiSummary> findById(Long doiId) {
        return repository.findById(doiId).map(DoiLookupAdapter::toSummary);
    }

    @Override
    public Optional<DoiSummary> findByDoi(String doi) {
        return repository.findByDoi(doi).map(DoiLookupAdapter::toSummary);
    }

    private static DoiSummary toSummary(Doi entity) {
        return new DoiSummary(
                entity.getId(),
                entity.getDoi(),
                entity.getStatus(),
                entity.getRegisteredAt(),
                entity.getErrorMessage());
    }
}
