package com.eneml.ajs.publication.internal.domain;

import com.eneml.ajs.publication.api.AccessStatus;
import com.eneml.ajs.publication.api.PublicationStatus;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "publication")
@Getter
@Setter
public class Publication extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PublicationStatus status = PublicationStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_status", nullable = false, length = 16)
    private AccessStatus accessStatus = AccessStatus.OPEN;

    @Column(name = "section_id", nullable = false)
    private Long sectionId;

    @Column(name = "issue_id")
    private Long issueId;

    @Column(name = "primary_author_email", length = 254)
    private String primaryAuthorEmail;

    @Column(name = "url_path", length = 255)
    private String urlPath;

    @Column(name = "license_url", length = 2048)
    private String licenseUrl;

    @Column(name = "copyright_holder", length = 512)
    private String copyrightHolder;

    @Column(name = "copyright_year")
    private Integer copyrightYear;

    @Column(length = 64)
    private String pages;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> title = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "abstract", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> abstractText = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<String> keywords = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<String> disciplines = new ArrayList<>();

    @Column(nullable = false, length = 8)
    private String locale = "en";

    @Column(name = "date_published")
    private Instant datePublished;

    @Column(name = "doi_id")
    private Long doiId;

    public boolean isDraft()      { return status == PublicationStatus.DRAFT; }
    public boolean isPublished()  { return status == PublicationStatus.PUBLISHED; }
}
