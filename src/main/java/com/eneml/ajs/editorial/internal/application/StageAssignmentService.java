package com.eneml.ajs.editorial.internal.application;

import com.eneml.ajs.editorial.api.StageParticipantSummary;
import com.eneml.ajs.editorial.api.StageRole;
import com.eneml.ajs.editorial.internal.domain.StageAssignment;
import com.eneml.ajs.editorial.internal.persistence.StageAssignmentRepository;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionStage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StageAssignmentService {

    private final StageAssignmentRepository repository;

    @Transactional(readOnly = true)
    public List<StageParticipantSummary> participantsAt(Long submissionId, SubmissionStage stage) {
        return repository.findBySubmissionIdAndStageOrderByRoleAscDateAssignedAsc(submissionId, stage)
                .stream()
                .map(StageAssignmentService::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StageParticipantSummary> allParticipants(Long submissionId) {
        return repository.findBySubmissionIdOrderByStageAscDateAssignedAsc(submissionId)
                .stream()
                .map(StageAssignmentService::toSummary)
                .toList();
    }

    /**
     * Idempotent assignment — if (submission, stage, user, role) already
     * exists, returns it; otherwise inserts a fresh row. Callers that want to
     * update flags (canChangeMetadata, recommendOnly) on the existing row
     * should use {@link #update}.
     */
    @Transactional
    public StageParticipantSummary assign(Long submissionId,
                                          SubmissionStage stage,
                                          Long userId,
                                          StageRole role,
                                          boolean canChangeMetadata,
                                          boolean recommendOnly,
                                          Long assignedByUserId) {
        if (recommendOnly && role != StageRole.SECTION_EDITOR) {
            throw new IllegalArgumentException("recommendOnly applies only to SECTION_EDITOR");
        }
        StageAssignment row = repository
                .findBySubmissionIdAndStageAndUserIdAndRole(submissionId, stage, userId, role)
                .orElseGet(() -> {
                    StageAssignment fresh = new StageAssignment();
                    fresh.setSubmissionId(submissionId);
                    fresh.setStage(stage);
                    fresh.setUserId(userId);
                    fresh.setRole(role);
                    fresh.setAssignedByUserId(assignedByUserId);
                    return fresh;
                });
        row.setCanChangeMetadata(canChangeMetadata);
        row.setRecommendOnly(recommendOnly);
        return toSummary(repository.save(row));
    }

    @Transactional
    public StageParticipantSummary update(Long submissionId,
                                           Long assignmentId,
                                           boolean canChangeMetadata,
                                           boolean recommendOnly) {
        StageAssignment row = repository.findById(assignmentId).orElseThrow(() ->
                new NotFoundException("stage assignment not found: " + assignmentId));
        if (!row.getSubmissionId().equals(submissionId)) {
            throw new NotFoundException("stage assignment not found: " + assignmentId);
        }
        if (recommendOnly && row.getRole() != StageRole.SECTION_EDITOR) {
            throw new IllegalArgumentException("recommendOnly applies only to SECTION_EDITOR");
        }
        row.setCanChangeMetadata(canChangeMetadata);
        row.setRecommendOnly(recommendOnly);
        return toSummary(row);
    }

    @Transactional
    public void unassign(Long submissionId, Long assignmentId) {
        Optional<StageAssignment> row = repository.findById(assignmentId);
        if (row.isEmpty() || !row.get().getSubmissionId().equals(submissionId)) {
            throw new NotFoundException("stage assignment not found: " + assignmentId);
        }
        repository.deleteByIdAndSubmissionId(assignmentId, submissionId);
    }

    static StageParticipantSummary toSummary(StageAssignment a) {
        return new StageParticipantSummary(
                a.getId(),
                a.getSubmissionId(),
                a.getStage(),
                a.getUserId(),
                a.getRole(),
                a.isCanChangeMetadata(),
                a.isRecommendOnly(),
                a.getDateAssigned(),
                a.getAssignedByUserId());
    }
}
