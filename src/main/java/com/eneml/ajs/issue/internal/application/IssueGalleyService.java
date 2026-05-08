package com.eneml.ajs.issue.internal.application;

import com.eneml.ajs.issue.internal.domain.IssueGalley;
import com.eneml.ajs.issue.internal.persistence.IssueGalleyRepository;
import com.eneml.ajs.issue.internal.persistence.IssueRepository;
import com.eneml.ajs.issue.internal.web.dto.IssueGalleyUpsertRequest;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IssueGalleyService {

    private final IssueGalleyRepository repository;
    private final IssueRepository issueRepository;

    public List<IssueGalley> listForIssue(Long issueId) {
        return repository.findByIssueIdOrderBySeqAscIdAsc(issueId);
    }

    public IssueGalley get(Long id) {
        return repository.findById(id).orElseThrow(() ->
                NotFoundException.of("IssueGalley", id));
    }

    @Transactional
    public IssueGalley add(Long issueId, IssueGalleyUpsertRequest request) {
        if (issueRepository.findById(issueId).isEmpty()) {
            throw NotFoundException.of("Issue", issueId);
        }
        validateSource(request);
        IssueGalley g = new IssueGalley();
        g.setIssueId(issueId);
        applyTo(g, request);
        return repository.save(g);
    }

    @Transactional
    public IssueGalley update(Long issueId, Long galleyId, IssueGalleyUpsertRequest request) {
        validateSource(request);
        IssueGalley g = get(galleyId);
        if (!g.getIssueId().equals(issueId)) {
            throw NotFoundException.of("IssueGalley on issue " + issueId, galleyId);
        }
        applyTo(g, request);
        return g;
    }

    @Transactional
    public void remove(Long issueId, Long galleyId) {
        IssueGalley g = get(galleyId);
        if (!g.getIssueId().equals(issueId)) {
            throw NotFoundException.of("IssueGalley on issue " + issueId, galleyId);
        }
        repository.delete(g);
    }

    private static void validateSource(IssueGalleyUpsertRequest request) {
        boolean hasFile = request.storedFileId() != null;
        boolean hasRemote = request.remoteUrl() != null && !request.remoteUrl().isBlank();
        if (hasFile == hasRemote) {
            throw new ConflictException(
                    "Exactly one of storedFileId or remoteUrl must be set");
        }
    }

    private static void applyTo(IssueGalley g, IssueGalleyUpsertRequest request) {
        g.setStoredFileId(request.storedFileId());
        g.setRemoteUrl(request.remoteUrl());
        g.setLocale(request.locale());
        g.setLabel(request.label());
        g.setSeq(request.seq());
        g.setApproved(request.approved());
    }
}
