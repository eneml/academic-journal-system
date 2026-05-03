package com.eneml.ajs.journal.internal.application;

import com.eneml.ajs.journal.api.SectionCreated;
import com.eneml.ajs.journal.api.SectionDeactivated;
import com.eneml.ajs.journal.api.SectionUpdated;
import com.eneml.ajs.journal.internal.domain.Section;
import com.eneml.ajs.journal.internal.persistence.SectionRepository;
import com.eneml.ajs.journal.internal.web.dto.SectionCreateRequest;
import com.eneml.ajs.journal.internal.web.dto.SectionUpdateRequest;
import com.eneml.ajs.journal.internal.web.mapper.SectionMapper;
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
public class SectionService {

    /** Stride for {@code seq} values during reorder; gaps allow ad-hoc inserts later. */
    private static final int SEQ_STRIDE = 10;

    private final SectionRepository repository;
    private final SectionMapper mapper;
    private final ApplicationEventPublisher events;

    public List<Section> list(boolean includeInactive) {
        return includeInactive ? repository.listAll() : repository.listActive();
    }

    public Section get(Long id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Section", id));
    }

    @Transactional
    public Section create(SectionCreateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new ConflictException(
                    "Section with code '%s' already exists".formatted(request.code()));
        }
        Section saved = repository.save(mapper.toEntity(request));
        events.publishEvent(SectionCreated.of(saved.getId(), saved.getCode()));
        return saved;
    }

    @Transactional
    public Section update(Long id, SectionUpdateRequest request) {
        Section section = get(id);
        mapper.updateEntity(request, section);
        events.publishEvent(SectionUpdated.of(id));
        return section;
    }

    @Transactional
    public Section deactivate(Long id) {
        Section section = get(id);
        if (section.isInactive()) {
            return section;
        }
        section.deactivate();
        events.publishEvent(SectionDeactivated.of(id));
        return section;
    }

    @Transactional
    public Section reactivate(Long id) {
        Section section = get(id);
        if (!section.isInactive()) {
            return section;
        }
        section.reactivate();
        events.publishEvent(SectionUpdated.of(id));
        return section;
    }

    @Transactional
    public void reorder(List<Long> orderedIds) {
        Map<Long, Section> byId = repository.findAllById(orderedIds).stream()
                .collect(Collectors.toMap(Section::getId, Function.identity()));
        if (byId.size() != orderedIds.size()) {
            List<Long> missing = orderedIds.stream().filter(id -> !byId.containsKey(id)).toList();
            throw NotFoundException.of("Section", missing);
        }
        int seq = SEQ_STRIDE;
        for (Long id : orderedIds) {
            Section section = byId.get(id);
            section.setSeq(seq);
            events.publishEvent(SectionUpdated.of(id));
            seq += SEQ_STRIDE;
        }
    }
}
