package com.eneml.ajs.messaging.internal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * Per-locale subject + body for a parent {@link EmailTemplate}. Composite key
 * (template_id, locale) matches the V145 schema; using {@code @IdClass} keeps
 * the parent reference rich (we read {@code locale.template} directly) while
 * the underlying primary key stays the natural composite.
 */
@Entity
@Table(name = "email_template_locale")
@IdClass(EmailTemplateLocale.PK.class)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class EmailTemplateLocale {

    @Id
    @ManyToOne(optional = false)
    @JoinColumn(name = "template_id")
    private EmailTemplate template;

    @Id
    @Column(nullable = false, length = 8)
    private String locale;

    @Column(nullable = false, length = 512)
    private String subject;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Version
    @Column(nullable = false)
    private long version;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static class PK implements Serializable {
        private Long template;
        private String locale;

        public PK() {}

        public PK(Long template, String locale) {
            this.template = template;
            this.locale = locale;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(template, pk.template)
                    && Objects.equals(locale, pk.locale);
        }

        @Override
        public int hashCode() {
            return Objects.hash(template, locale);
        }
    }
}
