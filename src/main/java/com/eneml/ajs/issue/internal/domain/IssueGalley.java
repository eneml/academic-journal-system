package com.eneml.ajs.issue.internal.domain;

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
@Table(name = "issue_galley")
@Getter
@Setter
public class IssueGalley extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issue_id", nullable = false)
    private Long issueId;

    @Column(name = "stored_file_id")
    private Long storedFileId;

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

    @Column(name = "doi_id")
    private Long doiId;
}
