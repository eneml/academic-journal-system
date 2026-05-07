package com.eneml.ajs.publication.internal.persistence;

import com.eneml.ajs.publication.api.PublicationStatus;
import com.eneml.ajs.publication.internal.domain.Publication;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PublicationRepository extends JpaRepository<Publication, Long> {

    Optional<Publication> findByUrlPath(String urlPath);

    List<Publication> findBySubmissionIdOrderByVersionNumberAsc(Long submissionId);

    @Query("""
            SELECT p FROM Publication p
            WHERE p.submissionId = :submissionId AND p.status = :status
            ORDER BY p.versionNumber DESC
            """)
    List<Publication> findBySubmissionIdAndStatus(Long submissionId, PublicationStatus status);

    Optional<Publication> findFirstBySubmissionIdOrderByVersionNumberDesc(Long submissionId);

    @Query("""
            SELECT p FROM Publication p
            WHERE p.status = com.eneml.ajs.publication.api.PublicationStatus.PUBLISHED
            ORDER BY p.datePublished DESC
            """)
    List<Publication> findRecentPublished(Pageable pageable);

    @Query("""
            SELECT p FROM Publication p
            WHERE p.status = com.eneml.ajs.publication.api.PublicationStatus.PUBLISHED
              AND p.sectionId = :sectionId
            ORDER BY p.datePublished DESC
            """)
    List<Publication> findRecentPublishedInSection(Long sectionId, Pageable pageable);

    @Query("""
            SELECT p FROM Publication p
            WHERE p.status = com.eneml.ajs.publication.api.PublicationStatus.PUBLISHED
              AND p.issueId = :issueId
            ORDER BY p.sectionId ASC, p.datePublished ASC, p.id ASC
            """)
    List<Publication> findPublishedInIssue(Long issueId);

    /** Used by the scheduled-publication sweep — find SCHEDULED rows whose target time has arrived. */
    List<Publication> findByStatusAndDatePublishedBefore(
            com.eneml.ajs.publication.api.PublicationStatus status,
            java.time.Instant cutoff);

    @Query(value = """
            SELECT COUNT(*) FROM publication
            WHERE status = 'PUBLISHED' AND date_published >= :since
            """,
            nativeQuery = true)
    long countPublishedSince(@org.springframework.data.repository.query.Param("since") java.time.Instant since);
}
