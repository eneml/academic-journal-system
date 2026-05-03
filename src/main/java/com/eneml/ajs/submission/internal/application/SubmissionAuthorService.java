package com.eneml.ajs.submission.internal.application;

import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.internal.domain.SubmissionAuthor;
import com.eneml.ajs.submission.internal.persistence.SubmissionAuthorRepository;
import com.eneml.ajs.submission.internal.web.dto.SubmissionAuthorUpsertRequest;
import com.eneml.ajs.submission.internal.web.mapper.SubmissionAuthorMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionAuthorService {

    private static final int SEQ_STRIDE = 10;

    private final SubmissionAuthorRepository repository;
    private final SubmissionAuthorMapper mapper;

    public List<SubmissionAuthor> list(Long submissionId) {
        return repository.findBySubmissionId(submissionId);
    }

    public SubmissionAuthor get(Long authorId) {
        return repository.findById(authorId).orElseThrow(() ->
                NotFoundException.of("SubmissionAuthor", authorId));
    }

    @Transactional
    public SubmissionAuthor add(Long submissionId, SubmissionAuthorUpsertRequest request) {
        SubmissionAuthor author = mapper.toEntity(request);
        author.setSubmissionId(submissionId);
        long count = repository.countBySubmissionId(submissionId);
        author.setSeq((int) ((count + 1) * SEQ_STRIDE));
        return repository.save(author);
    }

    @Transactional
    public SubmissionAuthor update(Long submissionId, Long authorId, SubmissionAuthorUpsertRequest request) {
        SubmissionAuthor author = get(authorId);
        if (!author.getSubmissionId().equals(submissionId)) {
            throw NotFoundException.of("SubmissionAuthor on submission " + submissionId, authorId);
        }
        mapper.applyUpdate(request, author);
        return author;
    }

    @Transactional
    public void remove(Long submissionId, Long authorId) {
        SubmissionAuthor author = get(authorId);
        if (!author.getSubmissionId().equals(submissionId)) {
            throw NotFoundException.of("SubmissionAuthor on submission " + submissionId, authorId);
        }
        repository.delete(author);
    }

    @Transactional
    public void reorder(Long submissionId, List<Long> orderedIds) {
        Map<Long, SubmissionAuthor> byId = repository.findAllById(orderedIds).stream()
                .filter(a -> a.getSubmissionId().equals(submissionId))
                .collect(Collectors.toMap(SubmissionAuthor::getId, Function.identity()));
        if (byId.size() != orderedIds.size()) {
            throw NotFoundException.of("SubmissionAuthor on submission " + submissionId,
                    orderedIds.stream().filter(id -> !byId.containsKey(id)).toList());
        }
        int seq = SEQ_STRIDE;
        for (Long id : orderedIds) {
            byId.get(id).setSeq(seq);
            seq += SEQ_STRIDE;
        }
    }
}
