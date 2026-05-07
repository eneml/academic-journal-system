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
import java.time.LocalDate;

/**
 * One day's worth of metric counters for a single publication, broken down
 * by surface (abstract page) and galley format (PDF / HTML / OTHER). Bumped
 * via atomic SQL UPSERTs in {@link PublicationMetricDailyRepository} so
 * concurrent reads can never race.
 */
@Entity
@Table(name = "publication_metric_daily")
@Getter
@Setter
public class PublicationMetricDaily {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "publication_id", nullable = false)
    private Long publicationId;

    @Column(name = "day", nullable = false)
    private LocalDate day;

    @Column(name = "abstract_views", nullable = false)
    private long abstractViews = 0L;

    @Column(name = "pdf_views", nullable = false)
    private long pdfViews = 0L;

    @Column(name = "html_views", nullable = false)
    private long htmlViews = 0L;

    @Column(name = "other_views", nullable = false)
    private long otherViews = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
