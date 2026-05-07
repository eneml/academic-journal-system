package com.eneml.ajs.messaging.internal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * One row per (user, key) pair representing the explicit choice a user has
 * made to opt out of an email category. Absence of a row means delivery is
 * allowed — the in-app feed is unaffected either way.
 */
@Entity
@Table(name = "notification_subscription_setting")
@IdClass(NotificationSubscriptionSetting.PK.class)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class NotificationSubscriptionSetting {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "setting_key", nullable = false, length = 64)
    private String settingKey;

    @Column(nullable = false)
    private boolean blocked = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static class PK implements Serializable {
        private Long userId;
        private String settingKey;

        public PK() {}

        public PK(Long userId, String settingKey) {
            this.userId = userId;
            this.settingKey = settingKey;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(userId, pk.userId)
                    && Objects.equals(settingKey, pk.settingKey);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, settingKey);
        }
    }
}
