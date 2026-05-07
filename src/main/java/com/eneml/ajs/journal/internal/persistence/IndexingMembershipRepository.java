package com.eneml.ajs.journal.internal.persistence;

import com.eneml.ajs.journal.internal.domain.IndexingMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IndexingMembershipRepository extends JpaRepository<IndexingMembership, Long> {

    List<IndexingMembership> findAllByOrderBySortOrderAscIdAsc();

    List<IndexingMembership> findAllByActiveTrueOrderBySortOrderAscIdAsc();

    Optional<IndexingMembership> findByCode(String code);
}
