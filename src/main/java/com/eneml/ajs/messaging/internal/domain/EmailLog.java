package com.eneml.ajs.messaging.internal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "email_log")
@Getter
@Setter
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_key", length = 128)
    private String templateKey;

    @Column(nullable = false, columnDefinition = "citext")
    private String recipient;

    @Column(nullable = false, columnDefinition = "text")
    private String subject;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt = Instant.now();

    public static EmailLog sent(String templateKey, String recipient, String subject,
                                 Long userId, Long notificationId) {
        EmailLog e = new EmailLog();
        e.templateKey = templateKey;
        e.recipient = recipient;
        e.subject = subject;
        e.status = "SENT";
        e.userId = userId;
        e.notificationId = notificationId;
        return e;
    }

    public static EmailLog failed(String templateKey, String recipient, String subject,
                                   Long userId, Long notificationId, String error) {
        EmailLog e = new EmailLog();
        e.templateKey = templateKey;
        e.recipient = recipient;
        e.subject = subject;
        e.status = "FAILED";
        e.errorMessage = error;
        e.userId = userId;
        e.notificationId = notificationId;
        return e;
    }

    public static EmailLog skipped(String templateKey, String recipient, String subject,
                                    Long userId, Long notificationId, String reason) {
        EmailLog e = new EmailLog();
        e.templateKey = templateKey;
        e.recipient = recipient;
        e.subject = subject;
        e.status = "SKIPPED";
        e.errorMessage = reason;
        e.userId = userId;
        e.notificationId = notificationId;
        return e;
    }
}
