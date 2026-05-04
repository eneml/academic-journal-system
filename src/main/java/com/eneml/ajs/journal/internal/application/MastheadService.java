package com.eneml.ajs.journal.internal.application;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserStatus;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.journal.api.MastheadEntryAdded;
import com.eneml.ajs.journal.api.MastheadEntryRemoved;
import com.eneml.ajs.journal.internal.domain.MastheadEntry;
import com.eneml.ajs.journal.internal.persistence.MastheadEntryRepository;
import com.eneml.ajs.journal.internal.web.dto.MastheadEntryUpsertRequest;
import com.eneml.ajs.journal.internal.web.mapper.MastheadMapper;
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
public class MastheadService {

    private static final int ORDER_STRIDE = 10;

    private final MastheadEntryRepository repository;
    private final MastheadMapper mapper;
    private final ApplicationEventPublisher events;
    private final UserDirectoryService userDirectory;

    public List<MastheadEntry> list(boolean visibleOnly) {
        return visibleOnly ? repository.listVisible() : repository.listAll();
    }

    public MastheadEntry get(Long id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("MastheadEntry", id));
    }

    @Transactional
    public MastheadEntry add(MastheadEntryUpsertRequest request) {
        validateUser(request.userId());
        MastheadEntry saved = repository.save(mapper.toEntity(request));
        events.publishEvent(MastheadEntryAdded.of(saved.getId(), saved.getUserId()));
        return saved;
    }

    @Transactional
    public MastheadEntry update(Long id, MastheadEntryUpsertRequest request) {
        MastheadEntry entry = get(id);
        if (!entry.getUserId().equals(request.userId())) {
            validateUser(request.userId());
        }
        mapper.updateEntity(request, entry);
        return entry;
    }

    private void validateUser(Long userId) {
        UserSummary u = userDirectory.findById(userId)
                .orElseThrow(() -> NotFoundException.of("User", userId));
        if (u.status() != UserStatus.ACTIVE) {
            throw new ConflictException(
                    "User %d is not active and cannot appear on the masthead".formatted(userId));
        }
    }

    @Transactional
    public void remove(Long id) {
        MastheadEntry entry = get(id);
        repository.delete(entry);
        events.publishEvent(MastheadEntryRemoved.of(id));
    }

    @Transactional
    public void reorder(List<Long> orderedIds) {
        Map<Long, MastheadEntry> byId = repository.findAllById(orderedIds).stream()
                .collect(Collectors.toMap(MastheadEntry::getId, Function.identity()));
        if (byId.size() != orderedIds.size()) {
            List<Long> missing = orderedIds.stream().filter(id -> !byId.containsKey(id)).toList();
            throw NotFoundException.of("MastheadEntry", missing);
        }
        int order = ORDER_STRIDE;
        for (Long id : orderedIds) {
            byId.get(id).setDisplayOrder(order);
            order += ORDER_STRIDE;
        }
    }
}
