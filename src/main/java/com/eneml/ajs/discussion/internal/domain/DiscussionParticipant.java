package com.eneml.ajs.discussion.internal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "discussion_participant")
@IdClass(DiscussionParticipant.PK.class)
@Getter
@Setter
public class DiscussionParticipant {

    @Id
    @Column(name = "discussion_id", nullable = false)
    private Long discussionId;

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "added_at", nullable = false)
    private Instant addedAt = Instant.now();

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    public static class PK implements Serializable {
        private Long discussionId;
        private Long userId;

        public PK() {}

        public PK(Long discussionId, Long userId) {
            this.discussionId = discussionId;
            this.userId = userId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(discussionId, pk.discussionId)
                    && Objects.equals(userId, pk.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(discussionId, userId);
        }
    }
}
