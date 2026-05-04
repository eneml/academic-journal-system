package com.eneml.ajs.journal.internal.domain;

import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.HashMap;
import java.util.Map;

/**
 * Editorial board listing entry shown on the public site. {@code userId} is a
 * logical reference to a User in the {@code identity} module — verified at
 * write time via {@code identity::api}. No FK is declared on purpose;
 * cross-module FKs leak boundaries.
 */
@Entity
@Table(name = "journal_masthead_entry")
@Getter
@Setter
public class MastheadEntry extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "role_label", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> roleLabel = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "bio_override", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> bioOverride = new HashMap<>();

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean visible = true;
}
