package com.eneml.ajs.issue.internal.domain;

import com.eneml.ajs.publication.api.AccessStatus;
import com.eneml.ajs.shared.persistence.AuditableEntity;
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
import java.util.Map;

@Entity
@Table(name = "issue")
@Getter
@Setter
public class Issue extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer volume;

    @Column(length = 32)
    private String number;

    private Integer year;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> title = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> description = new HashMap<>();

    /**
     * Free-form URL for legacy or externally-hosted covers (e.g. a CDN
     * URL). Most new issues will leave this null and use {@link #coverFileId}
     * instead so the cover binary lives inside the journal's storage.
     */
    @Column(name = "cover_image_path", length = 2048)
    private String coverImagePath;

    /**
     * FK to {@code stored_file.id}. Populated when an editor uploads a
     * cover image through {@code POST /api/v1/issues/{id}/cover}; readers
     * resolve a presigned URL from this id.
     */
    @Column(name = "cover_file_id")
    private Long coverFileId;

    @Column(name = "url_path", length = 255)
    private String urlPath;

    @Column(name = "show_volume", nullable = false)
    private boolean showVolume = true;

    @Column(name = "show_number", nullable = false)
    private boolean showNumber = true;

    @Column(name = "show_year", nullable = false)
    private boolean showYear = true;

    @Column(name = "show_title", nullable = false)
    private boolean showTitle = true;

    @Column(nullable = false)
    private boolean published;

    @Column(name = "date_published")
    private Instant datePublished;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_status", nullable = false, length = 16)
    private AccessStatus accessStatus = AccessStatus.OPEN;

    @Column(name = "open_access_date")
    private Instant openAccessDate;

    @Column(name = "doi_id")
    private Long doiId;

    public void publish() {
        this.published = true;
        if (this.datePublished == null) {
            this.datePublished = Instant.now();
        }
    }

    public void unpublish() {
        this.published = false;
    }
}
