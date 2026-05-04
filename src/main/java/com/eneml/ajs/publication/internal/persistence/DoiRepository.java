package com.eneml.ajs.publication.internal.persistence;

import com.eneml.ajs.publication.internal.domain.Doi;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DoiRepository extends JpaRepository<Doi, Long> {

    Optional<Doi> findByDoi(String doi);
}
