package com.eneml.ajs.review.internal.domain;

import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "review_form_response")
@Getter
@Setter
public class ReviewFormResponse extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "review_assignment_id", nullable = false)
    private Long reviewAssignmentId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "review_form_element_id", nullable = false)
    private ReviewFormElement element;

    /**
     * Single-value types store the raw string. Multi-value (CHECKBOXES)
     * stores a JSON-array string; the service tier handles the round-trip.
     */
    @Column(name = "response_value", columnDefinition = "text")
    private String responseValue;
}
