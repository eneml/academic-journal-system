package com.eneml.ajs.submission.internal.domain;

import com.eneml.ajs.shared.persistence.AuditableEntity;
import com.eneml.ajs.submission.api.SubmissionProgress;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "submission")
@Getter
@Setter
public class Submission extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_id", nullable = false)
    private Long sectionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SubmissionStage stage = SubmissionStage.SUBMISSION;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SubmissionStatus status = SubmissionStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SubmissionProgress progress = SubmissionProgress.START;

    @Column(nullable = false, length = 8)
    private String locale = "en";

    @Column(name = "submitted_by_user_id", nullable = false)
    private Long submittedByUserId;

    @Column(name = "comments_to_editor", columnDefinition = "text")
    private String commentsToEditor;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> title = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "abstract", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> abstractText = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<String> keywords = new java.util.ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<String> disciplines = new java.util.ArrayList<>();

    @Column(name = "references_raw", columnDefinition = "text")
    private String referencesRaw;

    @Column(name = "date_submitted")
    private Instant dateSubmitted;

    @Column(name = "date_last_activity", nullable = false)
    private Instant dateLastActivity = Instant.now();

    public boolean isDraft() {
        return status == SubmissionStatus.DRAFT;
    }

    public void touchActivity() {
        this.dateLastActivity = Instant.now();
    }

    public void markSubmitted() {
        this.status = SubmissionStatus.QUEUED;
        this.progress = SubmissionProgress.SUBMITTED;
        this.dateSubmitted = Instant.now();
        touchActivity();
    }
}
