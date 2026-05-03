package com.eneml.ajs.journal.internal.persistence;

import com.eneml.ajs.journal.internal.domain.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SectionRepository extends JpaRepository<Section, Long> {

    Optional<Section> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT s FROM Section s ORDER BY s.seq ASC, s.id ASC")
    List<Section> listAll();

    @Query("SELECT s FROM Section s WHERE s.inactive = false ORDER BY s.seq ASC, s.id ASC")
    List<Section> listActive();
}
