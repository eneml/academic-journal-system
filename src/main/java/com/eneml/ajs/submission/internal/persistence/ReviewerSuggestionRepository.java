package com.eneml.ajs.submission.internal.persistence;

import com.eneml.ajs.submission.internal.domain.ReviewerSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewerSuggestionRepository extends JpaRepository<ReviewerSuggestion, Long> {

    List<ReviewerSuggestion> findBySubmissionIdOrderByCreatedAtAsc(Long submissionId);
}
