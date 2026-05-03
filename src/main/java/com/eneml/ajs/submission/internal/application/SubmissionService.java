package com.eneml.ajs.submission.internal.application;

import com.eneml.ajs.journal.api.SectionLookup;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStarted;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.api.SubmissionSubmitted;
import com.eneml.ajs.submission.internal.domain.Submission;
import com.eneml.ajs.submission.internal.persistence.SubmissionRepository;
import com.eneml.ajs.submission.internal.web.dto.SubmissionDetailsRequest;
import com.eneml.ajs.submission.internal.web.dto.SubmissionStartRequest;
import com.eneml.ajs.submission.internal.web.mapper.SubmissionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionService {

    private final SubmissionRepository repository;
    private final SubmissionMapper mapper;
    private final SectionLookup sectionLookup;
    private final ApplicationEventPublisher events;

    public Submission get(Long id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Submission", id));
    }

    public Submission getOwned(Long id, Long userId) {
        Submission s = get(id);
        if (!s.getSubmittedByUserId().equals(userId)) {
            throw new AccessDeniedException("Submission %d is not owned by user %d".formatted(id, userId));
        }
        return s;
    }

    public Page<Submission> listMine(Long userId, Pageable pageable) {
        return repository.findBySubmittedByUserId(userId, pageable);
    }

    public Page<Submission> listByStatus(SubmissionStatus status, Pageable pageable) {
        return repository.findByStatus(status, pageable);
    }

    public Page<Submission> listEditorialQueue(SubmissionStage stage, Pageable pageable) {
        return repository.findByStatusAndStage(SubmissionStatus.QUEUED, stage, pageable);
    }

    @Transactional
    public Submission start(SubmissionStartRequest request, Long submittedByUserId) {
        sectionLookup.findById(request.sectionId())
                .filter(s -> !s.inactive())
                .orElseThrow(() -> new ConflictException(
                        "Section %d does not exist or is inactive".formatted(request.sectionId())));

        Submission submission = new Submission();
        submission.setSectionId(request.sectionId());
        submission.setLocale(request.locale());
        submission.setSubmittedByUserId(submittedByUserId);
        Submission saved = repository.save(submission);
        events.publishEvent(SubmissionStarted.of(saved.getId(), submittedByUserId));
        return saved;
    }

    @Transactional
    public Submission updateDetails(Long id, SubmissionDetailsRequest request, Long userId) {
        Submission s = getOwned(id, userId);
        if (!s.isDraft()) {
            throw new ConflictException("Submission %d is no longer in draft state".formatted(id));
        }
        mapper.applyDetails(request, s);
        s.setProgress(request.progress());
        s.touchActivity();
        return s;
    }

    @Transactional
    public Submission submit(Long id, Long userId) {
        Submission s = getOwned(id, userId);
        if (!s.isDraft()) {
            throw new ConflictException("Submission %d already submitted".formatted(id));
        }
        s.markSubmitted();
        events.publishEvent(SubmissionSubmitted.of(s.getId(), s.getSectionId(), userId));
        return s;
    }

    @Transactional
    public void deleteDraft(Long id, Long userId) {
        Submission s = getOwned(id, userId);
        if (!s.isDraft()) {
            throw new ConflictException("Only DRAFT submissions can be deleted");
        }
        repository.delete(s);
    }
}
