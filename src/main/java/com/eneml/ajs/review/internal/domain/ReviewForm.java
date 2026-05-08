package com.eneml.ajs.review.internal.domain;

import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "review_form")
@Getter
@Setter
public class ReviewForm extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> title = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> description = new HashMap<>();

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "complete_count", nullable = false)
    private int completeCount = 0;

    @OneToMany(
            mappedBy = "form",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    @OrderBy("seq ASC, id ASC")
    private List<ReviewFormElement> elements = new ArrayList<>();
}
