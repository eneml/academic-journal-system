package com.eneml.ajs.submission.internal.domain;

import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "reviewer_suggestion")
@Getter
@Setter
public class ReviewerSuggestion extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "given_name", nullable = false, length = 255)
    private String givenName;

    @Column(name = "family_name", length = 255)
    private String familyName;

    @Column(nullable = false, columnDefinition = "citext")
    private String email;

    @Column(name = "orcid_id", length = 19)
    private String orcidId;

    @Column(length = 512)
    private String affiliation;

    @Column(name = "suggestion_reason", columnDefinition = "text")
    private String suggestionReason;

    @Column(name = "existing_user_id")
    private Long existingUserId;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;
}
