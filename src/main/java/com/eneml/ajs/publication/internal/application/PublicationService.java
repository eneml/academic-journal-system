package com.eneml.ajs.publication.internal.application;

import com.eneml.ajs.journal.api.SectionLookup;
import com.eneml.ajs.publication.api.PublicationDrafted;
import com.eneml.ajs.publication.api.PublicationPublished;
import com.eneml.ajs.publication.api.PublicationStatus;
import com.eneml.ajs.publication.api.PublicationUnpublished;
import com.eneml.ajs.publication.api.PublicationVersioned;
import com.eneml.ajs.publication.internal.domain.Publication;
import com.eneml.ajs.publication.internal.persistence.PublicationRepository;
import com.eneml.ajs.publication.internal.web.dto.PublicationUpsertRequest;
import com.eneml.ajs.publication.internal.web.mapper.PublicationMapper;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicationService {

    private final PublicationRepository repository;
    private final PublicationMapper mapper;
    private final SubmissionLookup submissionLookup;
    private final SectionLookup sectionLookup;
    private final ApplicationEventPublisher events;

    public Publication get(Long id) {
        return repository.findById(id).orElseThrow(() ->
                NotFoundException.of("Publication", id));
    }

    public List<Publication> versionsOf(Long submissionId) {
        return repository.findBySubmissionIdOrderByVersionNumberAsc(submissionId);
    }

    @Transactional
    public Publication draftFirstVersion(Long submissionId) {
        var submission = submissionLookup.findById(submissionId)
                .orElseThrow(() -> NotFoundException.of("Submission", submissionId));
        if (!repository.findBySubmissionIdOrderByVersionNumberAsc(submissionId).isEmpty()) {
            throw new ConflictException("Submission %d already has at least one publication"
                    .formatted(submissionId));
        }
        Publication p = new Publication();
        p.setSubmissionId(submissionId);
        p.setVersionNumber(1);
        p.setSectionId(submission.sectionId());
        p.setLocale(submission.locale());
        p.setTitle(new HashMap<>(submission.title()));
        Publication saved = repository.save(p);
        events.publishEvent(PublicationDrafted.of(saved.getId(), submissionId, 1));
        return saved;
    }

    @Transactional
    public Publication createNextVersion(Long previousPublicationId) {
        Publication previous = get(previousPublicationId);
        if (!previous.isPublished()) {
            throw new ConflictException(
                    "Can only create a new version from a PUBLISHED predecessor");
        }
        Publication next = new Publication();
        next.setSubmissionId(previous.getSubmissionId());
        next.setVersionNumber(previous.getVersionNumber() + 1);
        next.setSectionId(previous.getSectionId());
        next.setIssueId(previous.getIssueId());
        next.setPrimaryAuthorEmail(previous.getPrimaryAuthorEmail());
        next.setLicenseUrl(previous.getLicenseUrl());
        next.setCopyrightHolder(previous.getCopyrightHolder());
        next.setCopyrightYear(previous.getCopyrightYear());
        next.setPages(previous.getPages());
        next.setTitle(new HashMap<>(previous.getTitle()));
        next.setAbstractText(new HashMap<>(previous.getAbstractText()));
        next.setKeywords(new java.util.ArrayList<>(previous.getKeywords()));
        next.setDisciplines(new java.util.ArrayList<>(previous.getDisciplines()));
        next.setLocale(previous.getLocale());
        Publication saved = repository.save(next);
        events.publishEvent(PublicationVersioned.of(
                saved.getId(), previous.getId(), previous.getSubmissionId(), saved.getVersionNumber()));
        return saved;
    }

    @Transactional
    public Publication update(Long publicationId, PublicationUpsertRequest request) {
        Publication p = get(publicationId);
        if (p.isPublished()) {
            throw new ConflictException(
                    "PUBLISHED publications are immutable; create a new version instead");
        }
        sectionLookup.findById(request.sectionId())
                .orElseThrow(() -> new ConflictException(
                        "Section %d does not exist".formatted(request.sectionId())));
        if (request.urlPath() != null) {
            repository.findByUrlPath(request.urlPath()).ifPresent(other -> {
                if (!other.getId().equals(publicationId)) {
                    throw new ConflictException("urlPath '%s' already in use".formatted(request.urlPath()));
                }
            });
        }
        mapper.applyUpdate(request, p);
        return p;
    }

    @Transactional
    public Publication publish(Long publicationId) {
        Publication p = get(publicationId);
        if (p.getStatus() == PublicationStatus.PUBLISHED) {
            return p;
        }
        if (p.getTitle().isEmpty()) {
            throw new ConflictException("Cannot publish without a title");
        }
        p.setStatus(PublicationStatus.PUBLISHED);
        p.setDatePublished(Instant.now());
        events.publishEvent(PublicationPublished.of(
                p.getId(), p.getSubmissionId(), p.getSectionId(), p.getIssueId(), p.getVersionNumber()));
        return p;
    }

    @Transactional
    public Publication unpublish(Long publicationId) {
        Publication p = get(publicationId);
        if (p.getStatus() != PublicationStatus.PUBLISHED) {
            throw new ConflictException("Only PUBLISHED items can be unpublished");
        }
        p.setStatus(PublicationStatus.UNPUBLISHED);
        events.publishEvent(PublicationUnpublished.of(p.getId(), p.getSubmissionId()));
        return p;
    }
}
