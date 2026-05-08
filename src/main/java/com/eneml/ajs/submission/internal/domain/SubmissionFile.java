package com.eneml.ajs.submission.internal.domain;

import com.eneml.ajs.shared.persistence.AuditableEntity;
import com.eneml.ajs.submission.api.FileStage;
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

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "submission_file")
@Getter
@Setter
public class SubmissionFile extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "stored_file_id", nullable = false)
    private Long storedFileId;

    @Column(name = "genre_id", nullable = false)
    private Long genreId;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_stage", nullable = false, length = 32)
    private FileStage fileStage;

    @Column(name = "source_submission_file_id")
    private Long sourceSubmissionFileId;

    /**
     * Self-reference for HTML-galley dependents (CSS, images). When set,
     * the file is rendered as part of its parent's served bundle rather
     * than appearing standalone in the files panel.
     */
    @Column(name = "parent_submission_file_id")
    private Long parentSubmissionFileId;

    @Column(name = "uploader_user_id", nullable = false)
    private Long uploaderUserId;

    @Column(length = 8)
    private String locale;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> label = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> description = new HashMap<>();

    @Column(nullable = false)
    private boolean viewable = true;
}
