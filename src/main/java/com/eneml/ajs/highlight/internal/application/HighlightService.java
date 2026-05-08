package com.eneml.ajs.highlight.internal.application;

import com.eneml.ajs.highlight.internal.domain.Highlight;
import com.eneml.ajs.highlight.internal.persistence.HighlightRepository;
import com.eneml.ajs.highlight.internal.web.dto.HighlightUpsertRequest;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.storage.api.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HighlightService {

    private static final Duration IMAGE_TTL = Duration.ofHours(1);

    private final HighlightRepository repository;
    private final FileStorageService storage;
    private final PublicationLookup publicationLookup;

    public List<Highlight> listAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc();
    }

    public List<Highlight> listEnabled() {
        return repository.findByEnabledTrueOrderBySortOrderAscIdAsc();
    }

    public Highlight get(Long id) {
        return repository.findById(id).orElseThrow(() ->
                NotFoundException.of("Highlight", id));
    }

    public String resolveImageUrl(Highlight h) {
        if (h.getImageStoredFileId() == null) return null;
        try {
            return storage.downloadUrl(h.getImageStoredFileId(), IMAGE_TTL).toString();
        } catch (Exception e) {
            return null;
        }
    }

    public String resolveTargetUrlPath(Highlight h) {
        if (h.getTargetPublicationId() == null) return null;
        return publicationLookup.findById(h.getTargetPublicationId())
                .map(PublicationSummary::urlPath)
                .orElse(null);
    }

    @Transactional
    public Highlight create(HighlightUpsertRequest request) {
        Highlight h = new Highlight();
        applyTo(h, request);
        return repository.save(h);
    }

    @Transactional
    public Highlight update(Long id, HighlightUpsertRequest request) {
        Highlight h = get(id);
        applyTo(h, request);
        return h;
    }

    @Transactional
    public void delete(Long id) {
        Highlight h = get(id);
        repository.delete(h);
    }

    private static void applyTo(Highlight h, HighlightUpsertRequest request) {
        h.setSortOrder(request.sortOrder());
        h.setTitle(request.title());
        h.setDescription(request.description());
        h.setUrl(request.url());
        h.setImageStoredFileId(request.imageStoredFileId());
        h.setTargetPublicationId(request.targetPublicationId());
        h.setEnabled(request.enabled());
    }
}
