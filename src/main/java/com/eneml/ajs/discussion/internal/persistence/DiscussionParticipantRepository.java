package com.eneml.ajs.discussion.internal.persistence;

import com.eneml.ajs.discussion.internal.domain.DiscussionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiscussionParticipantRepository extends
        JpaRepository<DiscussionParticipant, DiscussionParticipant.PK> {

    List<DiscussionParticipant> findByDiscussionId(Long discussionId);

    List<DiscussionParticipant> findByUserId(Long userId);

    boolean existsByDiscussionIdAndUserId(Long discussionId, Long userId);

    void deleteByDiscussionIdAndUserId(Long discussionId, Long userId);
}
