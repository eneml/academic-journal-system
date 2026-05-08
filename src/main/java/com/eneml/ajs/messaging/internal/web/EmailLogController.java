package com.eneml.ajs.messaging.internal.web;

import com.eneml.ajs.messaging.internal.domain.EmailLog;
import com.eneml.ajs.messaging.internal.persistence.EmailLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/email-log")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Email log")
class EmailLogController {

    private final EmailLogRepository repository;

    @GetMapping
    @Operation(summary = "Browse outbound email attempts (newest first)")
    Page<EmailLogResponse> list(
            @RequestParam(value = "recipient", required = false) String recipient,
            @RequestParam(value = "templateKey", required = false) String templateKey,
            @RequestParam(value = "status", required = false) String status,
            Pageable pageable) {
        Page<EmailLog> page;
        if (recipient != null && !recipient.isBlank()) {
            page = repository.findByRecipientIgnoreCaseOrderBySentAtDesc(recipient, pageable);
        } else if (templateKey != null && !templateKey.isBlank()) {
            page = repository.findByTemplateKeyOrderBySentAtDesc(templateKey, pageable);
        } else if (status != null && !status.isBlank()) {
            page = repository.findByStatusOrderBySentAtDesc(status, pageable);
        } else {
            page = repository.findByOrderBySentAtDesc(pageable);
        }
        return page.map(EmailLogController::toResponse);
    }

    private static EmailLogResponse toResponse(EmailLog e) {
        return new EmailLogResponse(
                e.getId(),
                e.getTemplateKey(),
                e.getRecipient(),
                e.getSubject(),
                e.getStatus(),
                e.getErrorMessage(),
                e.getUserId(),
                e.getNotificationId(),
                e.getSentAt());
    }

    public record EmailLogResponse(
            Long id,
            String templateKey,
            String recipient,
            String subject,
            String status,
            String errorMessage,
            Long userId,
            Long notificationId,
            Instant sentAt
    ) {}
}
