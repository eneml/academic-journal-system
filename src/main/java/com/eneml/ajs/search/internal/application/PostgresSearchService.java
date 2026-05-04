package com.eneml.ajs.search.internal.application;

import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.search.api.SearchHit;
import com.eneml.ajs.search.api.SearchQuery;
import com.eneml.ajs.search.api.SearchService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class PostgresSearchService implements SearchService {

    @PersistenceContext
    private EntityManager em;

    private final PublicationLookup publicationLookup;

    @Override
    public List<SearchHit> search(SearchQuery query) {
        if (query.text() == null || query.text().isBlank()) {
            return List.of();
        }
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery("""
                SELECT publication_id,
                       ts_rank_cd(searchable, plainto_tsquery('simple', :q)) AS rank,
                       ts_headline('simple',
                                   coalesce(abstract_text, ''),
                                   plainto_tsquery('simple', :q),
                                   'StartSel=<mark>,StopSel=</mark>,MaxWords=24,MinWords=8,ShortWord=2,MaxFragments=1') AS snippet
                FROM published_search_index
                WHERE searchable @@ plainto_tsquery('simple', :q)
                  AND (:sectionId IS NULL OR section_id = :sectionId)
                  AND (:year IS NULL OR year = :year)
                ORDER BY rank DESC, date_published DESC
                LIMIT :limit OFFSET :offset
                """)
                .setParameter("q", query.text())
                .setParameter("sectionId", query.sectionId())
                .setParameter("year", query.year())
                .setParameter("limit", query.size())
                .setParameter("offset", query.page() * (long) query.size())
                .getResultList();

        return rows.stream()
                .<SearchHit>map(row -> {
                    Long publicationId = ((Number) row[0]).longValue();
                    double score = ((Number) row[1]).doubleValue();
                    String snippet = (String) row[2];
                    var pub = publicationLookup.findById(publicationId).orElse(null);
                    if (pub == null) return null;
                    return new SearchHit(pub, score, snippet);
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }
}
