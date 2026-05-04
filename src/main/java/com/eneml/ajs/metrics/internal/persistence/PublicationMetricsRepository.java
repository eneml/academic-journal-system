package com.eneml.ajs.metrics.internal.persistence;

import com.eneml.ajs.metrics.internal.domain.PublicationMetrics;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PublicationMetricsRepository extends JpaRepository<PublicationMetrics, Long> {

    Optional<PublicationMetrics> findByPublicationId(long publicationId);

    /**
     * Atomic view-counter bump. Returns the number of rows updated — 0 if
     * the publication doesn't have a metrics row yet, in which case the
     * caller must INSERT one and retry.
     *
     * <p>Direct SQL keeps the operation server-side; nothing flushes through
     * Hibernate dirty-checking.
     */
    @Modifying
    @Query(value = """
        UPDATE publication_metrics
           SET view_count     = view_count + 1,
               last_viewed_at = :now,
               updated_at     = :now
         WHERE publication_id = :publicationId
        """, nativeQuery = true)
    int bumpViewCount(@Param("publicationId") long publicationId,
                      @Param("now") Instant now);

    /** Same shape as {@link #bumpViewCount}, but for downloads. */
    @Modifying
    @Query(value = """
        UPDATE publication_metrics
           SET download_count     = download_count + 1,
               last_downloaded_at = :now,
               updated_at         = :now
         WHERE publication_id = :publicationId
        """, nativeQuery = true)
    int bumpDownloadCount(@Param("publicationId") long publicationId,
                          @Param("now") Instant now);

    /** Top publications by view count, descending. Filters out zero-view rows. */
    @Query("""
        SELECT m FROM PublicationMetrics m
         WHERE m.viewCount > 0
         ORDER BY m.viewCount DESC, m.lastViewedAt DESC
        """)
    List<PublicationMetrics> findTopByViewCount(Pageable pageable);
}
