package com.eneml.ajs.issue.internal.application;

import com.eneml.ajs.issue.api.IssueLookup;
import com.eneml.ajs.issue.api.IssueSummary;
import com.eneml.ajs.issue.internal.persistence.IssueRepository;
import com.eneml.ajs.issue.internal.web.mapper.IssueMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class IssueLookupAdapter implements IssueLookup {

    private final IssueRepository repository;
    private final IssueMapper mapper;

    @Override
    public Optional<IssueSummary> findById(Long issueId) {
        return repository.findById(issueId).map(mapper::toSummary);
    }

    @Override
    public Optional<IssueSummary> findByUrlPath(String urlPath) {
        return repository.findByUrlPath(urlPath).map(mapper::toSummary);
    }

    @Override
    public Optional<IssueSummary> findCurrent() {
        return repository.findFirstByPublishedTrueOrderByDatePublishedDesc().map(mapper::toSummary);
    }

    @Override
    public List<IssueSummary> listPublished(int limit) {
        return mapper.toSummaries(repository.findPublishedRecent(
                PageRequest.of(0, Math.max(1, limit))));
    }
}
