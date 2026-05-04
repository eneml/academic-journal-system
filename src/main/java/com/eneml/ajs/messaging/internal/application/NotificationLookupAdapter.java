package com.eneml.ajs.messaging.internal.application;

import com.eneml.ajs.messaging.api.NotificationLookup;
import com.eneml.ajs.messaging.api.NotificationSummary;
import com.eneml.ajs.messaging.internal.persistence.NotificationRepository;
import com.eneml.ajs.messaging.internal.web.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class NotificationLookupAdapter implements NotificationLookup {

    private final NotificationRepository repository;
    private final NotificationMapper mapper;

    @Override
    public List<NotificationSummary> recentForUser(Long userId, int limit) {
        return mapper.toSummaries(repository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(0, Math.max(1, limit))));
    }

    @Override
    public long unreadCountForUser(Long userId) {
        return repository.countByUserIdAndReadAtIsNull(userId);
    }
}
