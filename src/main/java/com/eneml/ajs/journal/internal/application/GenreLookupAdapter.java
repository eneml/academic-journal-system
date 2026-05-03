package com.eneml.ajs.journal.internal.application;

import com.eneml.ajs.journal.api.GenreLookup;
import com.eneml.ajs.journal.api.GenreSummary;
import com.eneml.ajs.journal.internal.persistence.GenreRepository;
import com.eneml.ajs.journal.internal.web.mapper.GenreMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class GenreLookupAdapter implements GenreLookup {

    private final GenreRepository repository;
    private final GenreMapper mapper;

    @Override
    public Optional<GenreSummary> findById(Long genreId) {
        return repository.findById(genreId).map(mapper::toSummary);
    }

    @Override
    public Optional<GenreSummary> findByCode(String code) {
        return repository.findByCode(code).map(mapper::toSummary);
    }

    @Override
    public List<GenreSummary> listEnabled() {
        return mapper.toSummaries(repository.listEnabled());
    }
}
