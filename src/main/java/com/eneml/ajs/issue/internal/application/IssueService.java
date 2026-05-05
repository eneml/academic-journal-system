package com.eneml.ajs.issue.internal.application;

import com.eneml.ajs.issue.api.IssueCreated;
import com.eneml.ajs.issue.api.IssuePublished;
import com.eneml.ajs.issue.api.IssueUnpublished;
import com.eneml.ajs.issue.internal.domain.Issue;
import com.eneml.ajs.issue.internal.persistence.IssueRepository;
import com.eneml.ajs.issue.internal.web.dto.IssueUpsertRequest;
import com.eneml.ajs.issue.internal.web.mapper.IssueMapper;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.storage.api.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IssueService {

    private final IssueRepository repository;
    private final IssueMapper mapper;
    private final ApplicationEventPublisher events;
    private final FileStorageService fileStorage;

    public Issue get(Long id) {
        return repository.findById(id).orElseThrow(() ->
                NotFoundException.of("Issue", id));
    }

    public List<Issue> listAll() {
        return repository.findAll();
    }

    public Optional<Issue> findByUrlPath(String urlPath) {
        return repository.findByUrlPath(urlPath);
    }

    @Transactional
    public Issue create(IssueUpsertRequest request) {
        if (request.urlPath() != null && repository.findByUrlPath(request.urlPath()).isPresent()) {
            throw new ConflictException("urlPath '%s' already in use".formatted(request.urlPath()));
        }
        Issue saved = repository.save(mapper.toEntity(request));
        events.publishEvent(IssueCreated.of(saved.getId()));
        return saved;
    }

    @Transactional
    public Issue update(Long id, IssueUpsertRequest request) {
        Issue issue = get(id);
        if (request.urlPath() != null) {
            repository.findByUrlPath(request.urlPath()).ifPresent(other -> {
                if (!other.getId().equals(id)) {
                    throw new ConflictException("urlPath '%s' already in use".formatted(request.urlPath()));
                }
            });
        }
        mapper.applyUpdate(request, issue);
        return issue;
    }

    @Transactional
    public Issue publish(Long id) {
        Issue issue = get(id);
        if (issue.isPublished()) {
            return issue;
        }
        issue.publish();
        events.publishEvent(IssuePublished.of(id));
        return issue;
    }

    @Transactional
    public Issue unpublish(Long id) {
        Issue issue = get(id);
        if (!issue.isPublished()) {
            return issue;
        }
        issue.unpublish();
        events.publishEvent(IssueUnpublished.of(id));
        return issue;
    }

    @Transactional
    public void delete(Long id) {
        Issue issue = get(id);
        if (issue.isPublished()) {
            throw new ConflictException("Cannot delete a published issue; unpublish first");
        }
        // Storage rows linked through cover_file_id are released by the
        // ON DELETE SET NULL FK; the soft-deleted file row is then swept
        // out of S3 by the storage module's async cleaner.
        if (issue.getCoverFileId() != null) {
            fileStorage.delete(issue.getCoverFileId());
        }
        repository.delete(issue);
    }

    /**
     * Attaches a stored-file as the issue's cover. Replacing an existing
     * cover soft-deletes the previous file so the storage sweeper can
     * reclaim the S3 object.
     */
    @Transactional
    public Issue setCoverFile(Long id, Long storedFileId) {
        Issue issue = get(id);
        Long previous = issue.getCoverFileId();
        issue.setCoverFileId(storedFileId);
        if (previous != null && !previous.equals(storedFileId)) {
            fileStorage.delete(previous);
        }
        return issue;
    }

    @Transactional
    public Issue clearCoverFile(Long id) {
        Issue issue = get(id);
        Long previous = issue.getCoverFileId();
        if (previous != null) {
            issue.setCoverFileId(null);
            fileStorage.delete(previous);
        }
        return issue;
    }
}
