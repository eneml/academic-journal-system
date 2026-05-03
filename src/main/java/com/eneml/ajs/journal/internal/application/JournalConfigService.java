package com.eneml.ajs.journal.internal.application;

import com.eneml.ajs.journal.api.JournalConfigUpdated;
import com.eneml.ajs.journal.internal.domain.JournalConfig;
import com.eneml.ajs.journal.internal.persistence.JournalConfigRepository;
import com.eneml.ajs.journal.internal.web.dto.JournalConfigUpdateRequest;
import com.eneml.ajs.journal.internal.web.mapper.JournalConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JournalConfigService {

    private final JournalConfigRepository repository;
    private final JournalConfigMapper mapper;
    private final ApplicationEventPublisher events;

    public JournalConfig get() {
        return repository.findById(JournalConfig.SINGLETON_ID).orElseThrow(() ->
                new IllegalStateException(
                        "Journal config not initialized — V20 migration must seed singleton"));
    }

    @Transactional
    public JournalConfig update(JournalConfigUpdateRequest request) {
        JournalConfig config = get();
        mapper.updateEntity(request, config);
        events.publishEvent(JournalConfigUpdated.now());
        return config;
    }
}
