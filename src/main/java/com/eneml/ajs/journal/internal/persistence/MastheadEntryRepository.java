package com.eneml.ajs.journal.internal.persistence;

import com.eneml.ajs.journal.internal.domain.MastheadEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MastheadEntryRepository extends JpaRepository<MastheadEntry, Long> {

    @Query("SELECT m FROM MastheadEntry m ORDER BY m.displayOrder ASC, m.id ASC")
    List<MastheadEntry> listAll();

    @Query("SELECT m FROM MastheadEntry m WHERE m.visible = true ORDER BY m.displayOrder ASC, m.id ASC")
    List<MastheadEntry> listVisible();
}
