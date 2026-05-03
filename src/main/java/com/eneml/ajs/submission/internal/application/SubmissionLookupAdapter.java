package com.eneml.ajs.submission.internal.application;

import com.eneml.ajs.submission.api.SubmissionAuthorSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionSummary;
import com.eneml.ajs.submission.internal.persistence.SubmissionAuthorRepository;
import com.eneml.ajs.submission.internal.persistence.SubmissionRepository;
import com.eneml.ajs.submission.internal.web.mapper.SubmissionAuthorMapper;
import com.eneml.ajs.submission.internal.web.mapper.SubmissionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class SubmissionLookupAdapter implements SubmissionLookup {

    private final SubmissionRepository submissionRepository;
    private final SubmissionAuthorRepository authorRepository;
    private final SubmissionMapper submissionMapper;
    private final SubmissionAuthorMapper authorMapper;

    @Override
    public Optional<SubmissionSummary> findById(Long submissionId) {
        return submissionRepository.findById(submissionId).map(submissionMapper::toSummary);
    }

    @Override
    public List<SubmissionAuthorSummary> authorsOf(Long submissionId) {
        return authorMapper.toSummaries(authorRepository.findBySubmissionId(submissionId));
    }
}
