package com.eneml.ajs.integration.internal.persistence;

import com.eneml.ajs.integration.api.DepositStatus;
import com.eneml.ajs.integration.api.DepositSubject;
import com.eneml.ajs.integration.api.DepositTarget;
import com.eneml.ajs.integration.internal.domain.DepositRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepositRecordRepository extends JpaRepository<DepositRecord, Long> {

    List<DepositRecord> findByStatusOrderByCreatedAtAsc(DepositStatus status, Pageable pageable);

    List<DepositRecord> findBySubjectTypeAndSubjectIdOrderByCreatedAtDesc(
            DepositSubject subjectType, Long subjectId);

    Optional<DepositRecord> findFirstByTargetAndSubjectTypeAndSubjectIdOrderByCreatedAtDesc(
            DepositTarget target, DepositSubject subjectType, Long subjectId);
}
