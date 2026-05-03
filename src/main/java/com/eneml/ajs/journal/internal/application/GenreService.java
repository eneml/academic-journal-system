package com.eneml.ajs.journal.internal.application;

import com.eneml.ajs.journal.api.GenreCreated;
import com.eneml.ajs.journal.api.GenreToggled;
import com.eneml.ajs.journal.api.GenreUpdated;
import com.eneml.ajs.journal.internal.domain.Genre;
import com.eneml.ajs.journal.internal.persistence.GenreRepository;
import com.eneml.ajs.journal.internal.web.dto.GenreCreateRequest;
import com.eneml.ajs.journal.internal.web.dto.GenreUpdateRequest;
import com.eneml.ajs.journal.internal.web.mapper.GenreMapper;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GenreService {

    private static final int SEQ_STRIDE = 10;

    private final GenreRepository repository;
    private final GenreMapper mapper;
    private final ApplicationEventPublisher events;

    public List<Genre> list(boolean enabledOnly) {
        return enabledOnly ? repository.listEnabled() : repository.listAll();
    }

    public Genre get(Long id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Genre", id));
    }

    @Transactional
    public Genre create(GenreCreateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new ConflictException(
                    "Genre with code '%s' already exists".formatted(request.code()));
        }
        Genre saved = repository.save(mapper.toEntity(request));
        events.publishEvent(GenreCreated.of(saved.getId(), saved.getCode()));
        return saved;
    }

    @Transactional
    public Genre update(Long id, GenreUpdateRequest request) {
        Genre genre = get(id);
        mapper.updateEntity(request, genre);
        events.publishEvent(GenreUpdated.of(id));
        return genre;
    }

    @Transactional
    public Genre setEnabled(Long id, boolean enabled) {
        Genre genre = get(id);
        if (genre.isEnabled() == enabled) {
            return genre;
        }
        if (enabled) {
            genre.enable();
        } else {
            genre.disable();
        }
        events.publishEvent(GenreToggled.of(id, enabled));
        return genre;
    }

    @Transactional
    public void reorder(List<Long> orderedIds) {
        Map<Long, Genre> byId = repository.findAllById(orderedIds).stream()
                .collect(Collectors.toMap(Genre::getId, Function.identity()));
        if (byId.size() != orderedIds.size()) {
            List<Long> missing = orderedIds.stream().filter(id -> !byId.containsKey(id)).toList();
            throw NotFoundException.of("Genre", missing);
        }
        int seq = SEQ_STRIDE;
        for (Long id : orderedIds) {
            Genre genre = byId.get(id);
            genre.setSeq(seq);
            events.publishEvent(GenreUpdated.of(id));
            seq += SEQ_STRIDE;
        }
    }
}
