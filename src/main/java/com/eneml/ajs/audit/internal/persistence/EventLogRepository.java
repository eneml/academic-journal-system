package com.eneml.ajs.audit.internal.persistence;

import com.eneml.ajs.audit.internal.domain.EventLogEntry;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventLogRepository extends JpaRepository<EventLogEntry, Long> {

    List<EventLogEntry> findBySubmissionIdOrderByOccurredAtDesc(Long submissionId);

    long countBySubmissionId(Long submissionId);

    List<EventLogEntry> findAllByOrderByOccurredAtDesc(Pageable pageable);
}
