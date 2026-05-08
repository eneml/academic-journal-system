package com.eneml.ajs.review.internal.domain;

import com.eneml.ajs.review.api.ReviewFormElementType;
import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "review_form_element")
@Getter
@Setter
public class ReviewFormElement extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "review_form_id", nullable = false)
    private ReviewForm form;

    @Column(nullable = false)
    private int seq = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "element_type", nullable = false, length = 32)
    private ReviewFormElementType elementType;

    @Column(nullable = false)
    private boolean included = true;

    @Column(nullable = false)
    private boolean required = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> question = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> description = new HashMap<>();

    /**
     * For choice element types ({@code CHECKBOXES}/{@code RADIO}/
     * {@code DROPDOWN}) holds the list of options. Each option is an
     * object: {@code {"value": "yes", "label": {"en": "Yes", "ro": "Da"}}}.
     * For text/textarea types this stays an empty array.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "possible_responses", columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> possibleResponses = new ArrayList<>();
}
