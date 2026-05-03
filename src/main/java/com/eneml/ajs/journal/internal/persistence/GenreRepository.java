package com.eneml.ajs.journal.internal.persistence;

import com.eneml.ajs.journal.internal.domain.Genre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface GenreRepository extends JpaRepository<Genre, Long> {

    Optional<Genre> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT g FROM Genre g ORDER BY g.seq ASC, g.id ASC")
    List<Genre> listAll();

    @Query("SELECT g FROM Genre g WHERE g.enabled = true ORDER BY g.seq ASC, g.id ASC")
    List<Genre> listEnabled();
}
