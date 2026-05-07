package com.eneml.ajs.search.internal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Denormalized projection of a published publication, optimized for
 * Postgres full-text search via the {@code searchable} tsvector column.
 * The {@code searchable} column is computed in SQL when rows are
 * upserted by {@link com.eneml.ajs.search.internal.application.SearchIndexService}.
 */
@Entity
@Table(name = "published_search_index")
@Getter
@Setter
public class PublishedSearchIndex {

    @Id
    @Column(name = "publication_id")
    private Long publicationId;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "section_id", nullable = false)
    private Long sectionId;

    @Column(name = "issue_id")
    private Long issueId;

    private Integer year;

    @Column(length = 8)
    private String locale;

    @Column(name = "title_text", nullable = false, columnDefinition = "text")
    private String titleText;

    @Column(name = "abstract_text", columnDefinition = "text")
    private String abstractText;

    @Column(name = "keywords_text", columnDefinition = "text")
    private String keywordsText;

    @Column(name = "date_published")
    private Instant datePublished;

    @Column(name = "indexed_at", nullable = false)
    private Instant indexedAt = Instant.now();

    @Column(name = "article_type", nullable = false, length = 32)
    private String articleType = "ARTICLE";

    @Column(name = "open_access", nullable = false)
    private boolean openAccess = true;
}
