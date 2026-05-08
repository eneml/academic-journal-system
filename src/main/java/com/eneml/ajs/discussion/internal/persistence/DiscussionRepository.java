package com.eneml.ajs.discussion.internal.persistence;

import com.eneml.ajs.discussion.internal.domain.Discussion;
import com.eneml.ajs.submission.api.SubmissionStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiscussionRepository extends JpaRepository<Discussion, Long> {

    List<Discussion> findBySubmissionIdOrderBySeqAsc(Long submissionId);

    List<Discussion> findBySubmissionIdAndStageOrderBySeqAsc(Long submissionId, SubmissionStage stage);
}
