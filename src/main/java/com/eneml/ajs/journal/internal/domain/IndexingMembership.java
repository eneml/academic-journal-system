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

@Entity
@Table(name = "indexing_membership")
@Getter
@Setter
public class IndexingMembership extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32, unique = true)
    private String code;

    @Column(nullable = false, length = 128)
    private String label;

    @Column(length = 2048)
    private String url;

    /** Free-form metric badge — e.g. "Q1", "JIF 4.2", "CiteScore 8.7". Nullable. */
    @Column(length = 16)
    private String quartile;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
