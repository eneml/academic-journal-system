package com.eneml.ajs.messaging.internal.domain;

import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MapKey;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

/**
 * One canonical templated email — e.g. {@code submission.acknowledgement} or
 * {@code decision.accept.notifyAuthor}. The localised subject + body live on
 * {@link EmailTemplateLocale} children, keyed by BCP-47 locale tag. A row with
 * no child locales is treated as "not configured yet" and the listener that
 * needs it falls back to its hardcoded behaviour.
 */
@Entity
@Table(name = "email_template")
@Getter
@Setter
public class EmailTemplate extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String key;

    @Column(name = "is_custom", nullable = false)
    private boolean custom = false;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(columnDefinition = "text")
    private String description;

    @OneToMany(
            mappedBy = "template",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    @MapKey(name = "locale")
    private Map<String, EmailTemplateLocale> locales = new HashMap<>();
}
