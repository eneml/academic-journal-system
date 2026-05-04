package com.eneml.ajs.publication.internal.persistence;

import com.eneml.ajs.publication.internal.domain.Galley;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GalleyRepository extends JpaRepository<Galley, Long> {

    List<Galley> findByPublicationIdOrderBySeqAscIdAsc(Long publicationId);

    List<Galley> findByPublicationIdAndApprovedTrueOrderBySeqAscIdAsc(Long publicationId);
}
