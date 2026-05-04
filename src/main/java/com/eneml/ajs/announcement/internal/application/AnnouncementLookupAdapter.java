package com.eneml.ajs.announcement.internal.application;

import com.eneml.ajs.announcement.api.AnnouncementLookup;
import com.eneml.ajs.announcement.api.AnnouncementSummary;
import com.eneml.ajs.announcement.internal.persistence.AnnouncementRepository;
import com.eneml.ajs.announcement.internal.web.mapper.AnnouncementMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class AnnouncementLookupAdapter implements AnnouncementLookup {

    private final AnnouncementRepository repository;

    @Override
    public List<AnnouncementSummary> listVisible(Instant now, int limit) {
        return AnnouncementMapper.toSummaries(
                repository.findVisible(now, PageRequest.of(0, Math.max(1, limit))));
    }

    @Override
    public List<AnnouncementSummary> listAll() {
        return AnnouncementMapper.toSummaries(
                repository.findAllByOrderByPinnedDescDatePostedDescIdDesc());
    }
}
