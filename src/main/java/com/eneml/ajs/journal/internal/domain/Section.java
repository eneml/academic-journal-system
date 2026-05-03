package com.eneml.ajs.journal.internal.domain;

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
@Table(name = "journal_section")
@Getter
@Setter
public class Section extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false)
    private int seq;

    /** Default review form for this section, or {@code null} for no default. */
    @Column(name = "review_form_id")
    private Long reviewFormId;

    @Column(name = "editor_restricted", nullable = false)
    private boolean editorRestricted;

    @Column(name = "meta_indexed", nullable = false)
    private boolean metaIndexed = true;

    @Column(name = "meta_reviewed", nullable = false)
    private boolean metaReviewed = true;

    @Column(name = "abstracts_required", nullable = false)
    private boolean abstractsRequired = true;

    @Column(name = "hide_title", nullable = false)
    private boolean hideTitle;

    @Column(name = "hide_author", nullable = false)
    private boolean hideAuthor;

    @Column(nullable = false)
    private boolean inactive;

    @Column(name = "abstract_word_limit")
    private Integer abstractWordLimit;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> title = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> abbrev = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> policy = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "identify_type", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> identifyType = new HashMap<>();

    public void deactivate() {
        this.inactive = true;
    }

    public void reactivate() {
        this.inactive = false;
    }
}
