package com.eneml.ajs.publication.internal.persistence;

import com.eneml.ajs.publication.api.DoiStatus;
import com.eneml.ajs.publication.internal.domain.Doi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DoiRepository extends JpaRepository<Doi, Long> {

    Optional<Doi> findByDoi(String doi);

    /**
     * DOIs whose underlying publication has been touched after the DOI
     * was last deposited. Drives the weekly STALE sweep.
     */
    @Query("""
            SELECT d FROM Doi d
            WHERE d.status = com.eneml.ajs.publication.api.DoiStatus.REGISTERED
              AND d.registeredAt IS NOT NULL
              AND EXISTS (SELECT 1 FROM Publication p
                          WHERE p.doiId = d.id
                            AND p.updatedAt > d.registeredAt
                            AND p.updatedAt > :since)
            """)
    List<Doi> findRegisteredWithPublicationTouchedSince(Instant since);

    List<Doi> findByStatus(DoiStatus status);
}
