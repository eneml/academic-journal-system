package com.eneml.ajs.publication.internal.application;

import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.publication.internal.persistence.PublicationRepository;
import com.eneml.ajs.publication.internal.web.mapper.PublicationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class PublicationLookupAdapter implements PublicationLookup {

    private final PublicationRepository repository;
    private final PublicationMapper mapper;

    @Override
    public Optional<PublicationSummary> findById(Long publicationId) {
        return repository.findById(publicationId).map(mapper::toSummary);
    }

    @Override
    public Optional<PublicationSummary> findByUrlPath(String urlPath) {
        return repository.findByUrlPath(urlPath).map(mapper::toSummary);
    }

    @Override
    public List<PublicationSummary> versionsOf(Long submissionId) {
        return mapper.toSummaries(repository.findBySubmissionIdOrderByVersionNumberAsc(submissionId));
    }

    @Override
    public Optional<PublicationSummary> currentOf(Long submissionId) {
        return repository.findFirstBySubmissionIdOrderByVersionNumberDesc(submissionId)
                .map(mapper::toSummary);
    }

    @Override
    public List<PublicationSummary> publishedInSection(Long sectionId, int limit) {
        return mapper.toSummaries(repository.findRecentPublishedInSection(
                sectionId, PageRequest.of(0, Math.max(1, limit))));
    }

    @Override
    public List<PublicationSummary> publishedInIssue(Long issueId) {
        return mapper.toSummaries(repository.findPublishedInIssue(issueId));
    }

    @Override
    public List<PublicationSummary> latestPublished(int limit) {
        return mapper.toSummaries(repository.findRecentPublished(
                PageRequest.of(0, Math.max(1, limit))));
    }

    @Override
    public long countPublishedSince(java.time.Instant since) {
        return repository.countPublishedSince(since);
    }
}
