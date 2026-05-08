package com.eneml.ajs.discussion.internal.persistence;

import com.eneml.ajs.discussion.internal.domain.DiscussionMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiscussionMessageRepository extends JpaRepository<DiscussionMessage, Long> {

    List<DiscussionMessage> findByDiscussionIdOrderByPostedAtAsc(Long discussionId);

    long countByDiscussionId(Long discussionId);
}
