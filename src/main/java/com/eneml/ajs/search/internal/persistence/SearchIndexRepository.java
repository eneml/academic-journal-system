package com.eneml.ajs.search.internal.persistence;

import com.eneml.ajs.search.internal.domain.PublishedSearchIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface SearchIndexRepository extends JpaRepository<PublishedSearchIndex, Long> {

    /**
     * Upserts a row using a Postgres-native query so the {@code searchable}
     * tsvector is computed in the database (we never have to round-trip
     * the text through Java just to compute it).
     */
    @Modifying
    @Query(value = """
            INSERT INTO published_search_index
                (publication_id, submission_id, section_id, issue_id, year, locale,
                 title_text, abstract_text, keywords_text, searchable,
                 date_published, indexed_at)
            VALUES (
                :publicationId, :submissionId, :sectionId, :issueId, :year, :locale,
                :titleText, :abstractText, :keywordsText,
                setweight(to_tsvector('simple', coalesce(:titleText, '')), 'A')
                  || setweight(to_tsvector('simple', coalesce(:keywordsText, '')), 'B')
                  || setweight(to_tsvector('simple', coalesce(:abstractText, '')), 'C'),
                :datePublished, NOW())
            ON CONFLICT (publication_id) DO UPDATE SET
                section_id = EXCLUDED.section_id,
                issue_id = EXCLUDED.issue_id,
                year = EXCLUDED.year,
                locale = EXCLUDED.locale,
                title_text = EXCLUDED.title_text,
                abstract_text = EXCLUDED.abstract_text,
                keywords_text = EXCLUDED.keywords_text,
                searchable = EXCLUDED.searchable,
                date_published = EXCLUDED.date_published,
                indexed_at = NOW()
            """, nativeQuery = true)
    int upsert(@Param("publicationId") Long publicationId,
               @Param("submissionId") Long submissionId,
               @Param("sectionId") Long sectionId,
               @Param("issueId") Long issueId,
               @Param("year") Integer year,
               @Param("locale") String locale,
               @Param("titleText") String titleText,
               @Param("abstractText") String abstractText,
               @Param("keywordsText") String keywordsText,
               @Param("datePublished") Instant datePublished);

    /**
     * Updates the {@code fulltext_text} on an existing index row and
     * re-derives {@code searchable} so phrase hits in the body surface
     * the article. Title/abstract/keywords keep their A/B/C weights;
     * the body lands at D.
     */
    @Modifying
    @Query(value = """
            UPDATE published_search_index
               SET fulltext_text = :fulltextText,
                   searchable =
                       setweight(to_tsvector('simple', coalesce(title_text, '')), 'A')
                       || setweight(to_tsvector('simple', coalesce(keywords_text, '')), 'B')
                       || setweight(to_tsvector('simple', coalesce(abstract_text, '')), 'C')
                       || setweight(to_tsvector('simple', coalesce(:fulltextText, '')), 'D'),
                   indexed_at = NOW()
             WHERE publication_id = :publicationId
            """, nativeQuery = true)
    int updateFulltext(@Param("publicationId") Long publicationId,
                       @Param("fulltextText") String fulltextText);
}
