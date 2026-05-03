package com.eneml.ajs.journal.internal.application;

import com.eneml.ajs.journal.api.SectionLookup;
import com.eneml.ajs.journal.api.SectionSummary;
import com.eneml.ajs.journal.internal.persistence.SectionRepository;
import com.eneml.ajs.journal.internal.web.mapper.SectionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class SectionLookupAdapter implements SectionLookup {

    private final SectionRepository repository;
    private final SectionMapper mapper;

    @Override
    public Optional<SectionSummary> findById(Long sectionId) {
        return repository.findById(sectionId).map(mapper::toSummary);
    }

    @Override
    public Optional<SectionSummary> findByCode(String code) {
        return repository.findByCode(code).map(mapper::toSummary);
    }

    @Override
    public List<SectionSummary> listActive() {
        return mapper.toSummaries(repository.listActive());
    }
}
