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
}
