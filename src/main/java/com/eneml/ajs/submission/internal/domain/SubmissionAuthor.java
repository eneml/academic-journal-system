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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "submission_author")
@Getter
@Setter
public class SubmissionAuthor extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(nullable = false)
    private int seq;

    @Column(name = "given_name", nullable = false, length = 255)
    private String givenName;

    @Column(name = "family_name", length = 255)
    private String familyName;

    @Column(nullable = false, length = 254, columnDefinition = "citext")
    private String email;

    @Column(name = "orcid_id", length = 19)
    private String orcidId;

    @Column(length = 512)
    private String affiliation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> biography = new HashMap<>();

    @Column(length = 2)
    private String country;

    @Column(name = "is_corresponding", nullable = false)
    private boolean corresponding;

    @Column(name = "include_in_browse", nullable = false)
    private boolean includeInBrowse = true;

    @Column(name = "user_id")
    private Long userId;
}
