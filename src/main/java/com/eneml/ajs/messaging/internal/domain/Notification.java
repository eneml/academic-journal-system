package com.eneml.ajs.messaging.internal.domain;

import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "notification")
@Getter
@Setter
public class Notification extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 64)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private NotificationLevel level = NotificationLevel.NORMAL;

    @Column(nullable = false, length = 512)
    private String title;

    @Column(columnDefinition = "text")
    private String body;

    @Column(name = "assoc_type", length = 64)
    private String assocType;

    @Column(name = "assoc_id")
    private Long assocId;

    @Column(length = 2048)
    private String href;

    @Column(name = "read_at")
    private Instant readAt;

    public boolean isUnread() { return readAt == null; }

    public void markRead() {
        if (readAt == null) {
            readAt = Instant.now();
        }
    }
}
