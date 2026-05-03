package com.eneml.ajs.submission.internal.application;

import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.api.SubmissionWorkflow;
import com.eneml.ajs.submission.internal.domain.Submission;
import com.eneml.ajs.submission.internal.persistence.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class SubmissionWorkflowAdapter implements SubmissionWorkflow {

    private final SubmissionRepository repository;

    @Override
    @Transactional
    public void transitionStage(Long submissionId, SubmissionStage newStage, SubmissionStatus newStatus) {
        Submission s = repository.findById(submissionId).orElseThrow(() ->
                NotFoundException.of("Submission", submissionId));
        s.setStage(newStage);
        s.setStatus(newStatus);
        s.touchActivity();
    }
}
