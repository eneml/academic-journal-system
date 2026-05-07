package com.eneml.ajs.messaging.internal.application;

import com.eneml.ajs.messaging.api.NotificationCreated;
import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.internal.domain.Notification;
import com.eneml.ajs.messaging.internal.persistence.NotificationRepository;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository repository;
    private final ApplicationEventPublisher events;

    public List<Notification> recentFor(Long userId, int limit) {
        return repository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(0, Math.max(1, limit)));
    }

    public long unreadCountFor(Long userId) {
        return repository.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public Notification create(NotificationDraft draft) {
        Notification n = new Notification();
        n.setUserId(draft.userId());
        n.setType(draft.type());
        n.setLevel(draft.level() == null ? NotificationLevel.NORMAL : draft.level());
        n.setTitle(draft.title());
        n.setBody(draft.body());
        n.setAssocType(draft.assocType());
        n.setAssocId(draft.assocId());
        n.setHref(draft.href());
        n.setTemplateKey(draft.templateKey());
        Notification saved = repository.save(n);
        events.publishEvent(NotificationCreated.of(saved.getId(), saved.getUserId(), saved.getType()));
        return saved;
    }

    @Transactional
    public Notification markRead(Long notificationId, Long userId) {
        Notification n = repository.findById(notificationId).orElseThrow(() ->
                NotFoundException.of("Notification", notificationId));
        if (!n.getUserId().equals(userId)) {
            throw new AccessDeniedException("Not your notification");
        }
        n.markRead();
        return n;
    }

    @Transactional
    public int markAllRead(Long userId) {
        return repository.markAllReadForUser(userId);
    }
}
