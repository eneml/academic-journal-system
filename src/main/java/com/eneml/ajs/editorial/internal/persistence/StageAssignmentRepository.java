package com.eneml.ajs.editorial.internal.persistence;

import com.eneml.ajs.editorial.api.StageRole;
import com.eneml.ajs.editorial.internal.domain.StageAssignment;
import com.eneml.ajs.submission.api.SubmissionStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StageAssignmentRepository extends JpaRepository<StageAssignment, Long> {

    List<StageAssignment> findBySubmissionIdAndStageOrderByRoleAscDateAssignedAsc(
            Long submissionId, SubmissionStage stage);

    List<StageAssignment> findBySubmissionIdOrderByStageAscDateAssignedAsc(Long submissionId);

    Optional<StageAssignment> findBySubmissionIdAndStageAndUserIdAndRole(
            Long submissionId, SubmissionStage stage, Long userId, StageRole role);

    void deleteByIdAndSubmissionId(Long id, Long submissionId);
}
