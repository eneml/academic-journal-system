package com.eneml.ajs.editorial.internal.persistence;

import com.eneml.ajs.editorial.internal.domain.EditorialDecision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EditorialDecisionRepository extends JpaRepository<EditorialDecision, Long> {

    List<EditorialDecision> findBySubmissionIdOrderByDateDecided(Long submissionId);
}
