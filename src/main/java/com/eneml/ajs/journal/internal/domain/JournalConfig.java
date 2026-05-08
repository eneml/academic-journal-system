package com.eneml.ajs.journal.internal.domain;

import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Singleton journal configuration. Always exists with id = {@link #SINGLETON_ID}.
 * Seeded by Flyway V20.
 */
@Entity
@Table(name = "journal_config")
@Getter
@Setter
public class JournalConfig extends AuditableEntity {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "name", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> name = new HashMap<>();

    @Column(name = "issn_print", length = 9)
    private String issnPrint;

    @Column(name = "issn_online", length = 9)
    private String issnOnline;

    @Column(name = "default_locale", nullable = false, length = 8)
    private String defaultLocale = "en";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "supported_locales", columnDefinition = "jsonb", nullable = false)
    private Set<String> supportedLocales = new HashSet<>(Set.of("en"));

    @Column(name = "contact_email", length = 254)
    private String contactEmail;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "masthead_text", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> mastheadText = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "copyright_notice", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> copyrightNotice = new HashMap<>();

    @Column(name = "license_url", length = 2048)
    private String licenseUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "about", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> about = new HashMap<>();

    @Column(name = "submissions_open", nullable = false)
    private boolean submissionsOpen = true;

    @Column(name = "reviewer_suggestions_enabled", nullable = false)
    private boolean reviewerSuggestionsEnabled = true;

    @Column(name = "acronym", length = 32)
    private String acronym;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "subtitle", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> subtitle = new HashMap<>();

    @Column(name = "founding_year")
    private Integer foundingYear;

    @Column(name = "frequency", length = 64)
    private String frequency;

    @Column(name = "publisher", length = 256)
    private String publisher;

    @Column(name = "country_of_publication", length = 2)
    private String countryOfPublication;

    @Column(name = "tagline", length = 120)
    private String tagline;

    @Column(name = "tagline_ornament", length = 8)
    private String taglineOrnament;

    /**
     * Per-locale privacy statement shown on the public site and linked
     * from the author wizard. Empty map means "no statement configured".
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "privacy_statement", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> privacyStatement = new HashMap<>();

    /**
     * Per-locale competing-interests policy. Authors are pointed at this
     * when filling in the disclosure step of the wizard.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "competing_interests_policy", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> competingInterestsPolicy = new HashMap<>();

    /**
     * Ordered checklist the author must agree to before submitting. Each
     * item carries a stable id (so reordering doesn't break references)
     * and a per-locale label.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "submission_checklist", columnDefinition = "jsonb", nullable = false)
    private List<ChecklistItem> submissionChecklist = new ArrayList<>();

    public record ChecklistItem(String id, Map<String, String> label) {}
}
