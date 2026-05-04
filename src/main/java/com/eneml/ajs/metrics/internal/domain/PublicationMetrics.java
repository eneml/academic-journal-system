package com.eneml.ajs.metrics.internal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Per-publication view + download counter row. Mutated through atomic SQL
 * UPDATEs in {@link com.eneml.ajs.metrics.internal.persistence.PublicationMetricsRepository}
 * — never via JPA dirty-checking — so concurrent reads don't race the
 * counter and we don't need optimistic locking.
 *
 * <p>{@code publicationId} is a logical reference to a Publication in the
 * publication module. No DB-level FK is declared on purpose so the metrics
 * module can stay independent.
 */
@Entity
@Table(name = "publication_metrics")
@Getter
@Setter
public class PublicationMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "publication_id", nullable = false, unique = true)
    private Long publicationId;

    @Column(name = "view_count", nullable = false)
    private long viewCount = 0L;

    @Column(name = "download_count", nullable = false)
    private long downloadCount = 0L;

    @Column(name = "last_viewed_at")
    private Instant lastViewedAt;

    @Column(name = "last_downloaded_at")
    private Instant lastDownloadedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
