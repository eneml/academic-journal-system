package com.eneml.ajs.submission.internal.application;

import com.eneml.ajs.submission.api.SubmissionAuthorSummary;
import com.eneml.ajs.submission.api.SubmissionContent;
import com.eneml.ajs.submission.api.SubmissionFileSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.eneml.ajs.submission.api.SubmissionSummary;
import com.eneml.ajs.submission.internal.persistence.SubmissionAuthorRepository;
import com.eneml.ajs.submission.internal.persistence.SubmissionFileRepository;
import com.eneml.ajs.submission.internal.persistence.SubmissionRepository;
import com.eneml.ajs.submission.internal.web.mapper.SubmissionAuthorMapper;
import com.eneml.ajs.submission.internal.web.mapper.SubmissionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class SubmissionLookupAdapter implements SubmissionLookup {

    private final SubmissionRepository submissionRepository;
    private final SubmissionAuthorRepository authorRepository;
    private final SubmissionFileRepository fileRepository;
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

    @Override
    public Optional<SubmissionContent> findContent(Long submissionId) {
        return submissionRepository.findById(submissionId)
                .map(s -> new SubmissionContent(
                        s.getId(),
                        s.getLocale(),
                        // Defensive copies — callers shouldn't be able to mutate
                        // the entity's persistent collections via the API.
                        new HashMap<>(s.getTitle() == null ? java.util.Map.of() : s.getTitle()),
                        new HashMap<>(s.getAbstractText() == null
                                ? java.util.Map.of() : s.getAbstractText()),
                        s.getKeywords() == null ? List.of() : List.copyOf(s.getKeywords())));
    }

    @Override
    public List<SubmissionFileSummary> filesOf(Long submissionId) {
        return fileRepository.findBySubmissionId(submissionId).stream()
                .map(f -> new SubmissionFileSummary(
                        f.getId(),
                        f.getSubmissionId(),
                        f.getFileStage(),
                        f.getStoredFileId(),
                        f.getUploaderUserId(),
                        f.getCreatedAt()))
                .toList();
    }

    @Override
    public List<SubmissionAuthorSummary> contributionsByOrcid(String orcidId) {
        if (orcidId == null || orcidId.isBlank()) return List.of();
        return authorMapper.toSummaries(authorRepository.findByOrcidId(orcidId.trim()));
    }

    @Override
    public long countSubmittedSince(Instant since) {
        return submissionRepository.countSubmittedSince(since);
    }

    @Override
    public Map<Integer, Long> monthlySubmissionCounts(int year) {
        Map<Integer, Long> out = new LinkedHashMap<>();
        for (Object[] row : submissionRepository.monthlySubmissionCounts(year)) {
            Integer month = ((Number) row[0]).intValue();
            Long count = ((Number) row[1]).longValue();
            out.put(month, count);
        }
        return out;
    }

    @Override
    public Map<Long, Long> countBySectionSince(Instant since) {
        Map<Long, Long> out = new LinkedHashMap<>();
        for (Object[] row : submissionRepository.countBySectionSince(since)) {
            out.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return out;
    }
}
