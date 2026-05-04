package com.eneml.ajs.publication.internal.domain;

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
@Table(name = "publication_galley")
@Getter
@Setter
public class Galley extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "publication_id", nullable = false)
    private Long publicationId;

    /** Either {@link #submissionFileId} OR {@link #remoteUrl} must be set. */
    @Column(name = "submission_file_id")
    private Long submissionFileId;

    @Column(name = "remote_url", length = 2048)
    private String remoteUrl;

    @Column(length = 8)
    private String locale;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> label = new HashMap<>();

    @Column(nullable = false)
    private int seq;

    @Column(name = "is_approved", nullable = false)
    private boolean approved;

    @Column(name = "url_path", length = 255)
    private String urlPath;

    @Column(name = "doi_id")
    private Long doiId;

    public void approve() { this.approved = true; }
    public void unapprove() { this.approved = false; }
}
