package com.eneml.ajs.messaging.internal.persistence;

import com.eneml.ajs.messaging.internal.domain.EmailTemplate;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {

    /**
     * Resolve a template by its canonical key. The {@code locales} association
     * is eagerly fetched so callers can pick the right locale without an extra
     * round-trip.
     */
    @EntityGraph(attributePaths = "locales")
    Optional<EmailTemplate> findByKey(String key);

    /** Listing for the manager UI; locales fetched eagerly for table preview. */
    @EntityGraph(attributePaths = "locales")
    List<EmailTemplate> findAllByOrderByKeyAsc();
}
