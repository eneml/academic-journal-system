package com.eneml.ajs.messaging.internal.persistence;

import com.eneml.ajs.messaging.internal.domain.EmailLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {

    Page<EmailLog> findByOrderBySentAtDesc(Pageable pageable);

    Page<EmailLog> findByRecipientIgnoreCaseOrderBySentAtDesc(String recipient, Pageable pageable);

    Page<EmailLog> findByTemplateKeyOrderBySentAtDesc(String templateKey, Pageable pageable);

    Page<EmailLog> findByStatusOrderBySentAtDesc(String status, Pageable pageable);
}
