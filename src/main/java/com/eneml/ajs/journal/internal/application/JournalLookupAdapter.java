package com.eneml.ajs.journal.internal.application;

import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.journal.internal.domain.JournalConfig;
import com.eneml.ajs.journal.internal.persistence.JournalConfigRepository;
import com.eneml.ajs.journal.internal.web.mapper.JournalConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class JournalLookupAdapter implements JournalLookup {

    private final JournalConfigRepository repository;
    private final JournalConfigMapper mapper;

    @Override
    public JournalConfigSummary getConfig() {
        return mapper.toSummary(repository.findById(JournalConfig.SINGLETON_ID).orElseThrow(() ->
                new IllegalStateException(
                        "Journal config not initialized — V20 migration must seed singleton")));
    }
}
