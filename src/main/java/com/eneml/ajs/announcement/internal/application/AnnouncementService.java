package com.eneml.ajs.announcement.internal.application;

import com.eneml.ajs.announcement.api.AnnouncementPosted;
import com.eneml.ajs.announcement.api.AnnouncementType;
import com.eneml.ajs.announcement.api.AnnouncementWithdrawn;
import com.eneml.ajs.announcement.internal.domain.Announcement;
import com.eneml.ajs.announcement.internal.persistence.AnnouncementRepository;
import com.eneml.ajs.announcement.internal.web.dto.AnnouncementUpsertRequest;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnnouncementService {

    private final AnnouncementRepository repository;
    private final ApplicationEventPublisher events;

    public Announcement get(Long id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Announcement", id));
    }

    public List<Announcement> listAll() {
        return repository.findAllByOrderByPinnedDescDatePostedDescIdDesc();
    }

    public List<Announcement> listVisible(Instant now, int limit) {
        return repository.findVisible(now, PageRequest.of(0, Math.max(1, limit)));
    }

    @Transactional
    public Announcement create(AnnouncementUpsertRequest request) {
        if (request.urlPath() != null && !request.urlPath().isBlank()) {
            ensureUniqueUrlPath(request.urlPath(), null);
        }
        Announcement a = new Announcement();
        applyRequest(a, request);
        Announcement saved = repository.save(a);
        events.publishEvent(AnnouncementPosted.of(saved.getId(), saved.getType()));
        return saved;
    }

    @Transactional
    public Announcement update(Long id, AnnouncementUpsertRequest request) {
        Announcement a = get(id);
        if (request.urlPath() != null && !request.urlPath().isBlank()) {
            ensureUniqueUrlPath(request.urlPath(), id);
        }
        applyRequest(a, request);
        return a;
    }

    @Transactional
    public void delete(Long id) {
        Announcement a = get(id);
        repository.delete(a);
        events.publishEvent(AnnouncementWithdrawn.of(id));
    }

    @Transactional
    public Announcement setVisible(Long id, boolean visible) {
        Announcement a = get(id);
        a.setVisible(visible);
        if (!visible) {
            events.publishEvent(AnnouncementWithdrawn.of(id));
        }
        return a;
    }

    private void applyRequest(Announcement a, AnnouncementUpsertRequest request) {
        if (request.type() != null) a.setType(request.type());
        else if (a.getType() == null) a.setType(AnnouncementType.GENERAL);
        a.setTitle(request.title());
        a.setBody(request.body());
        a.setUrlPath(request.urlPath() == null || request.urlPath().isBlank() ? null : request.urlPath());
        a.setDateExpires(request.dateExpires());
        if (request.pinned() != null) a.setPinned(request.pinned());
        if (request.visible() != null) a.setVisible(request.visible());
    }

    private void ensureUniqueUrlPath(String urlPath, Long excludingId) {
        Optional<Announcement> existing = repository.findAll().stream()
                .filter(a -> urlPath.equals(a.getUrlPath()))
                .findFirst();
        existing.ifPresent(other -> {
            if (excludingId == null || !excludingId.equals(other.getId())) {
                throw new ConflictException("urlPath '%s' already in use".formatted(urlPath));
            }
        });
    }
}
