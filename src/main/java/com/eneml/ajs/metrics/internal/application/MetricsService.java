package com.eneml.ajs.metrics.internal.application;

import com.eneml.ajs.metrics.api.MetricsRecorder;
import com.eneml.ajs.metrics.internal.domain.PublicationMetrics;
import com.eneml.ajs.metrics.internal.persistence.PublicationMetricsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Implements {@link MetricsRecorder}. Each bump is its own transaction
 * (REQUIRES_NEW) so a counter failure can't roll back the calling
 * controller's response — counters are best-effort, the page render is
 * the priority.
 *
 * <p>The lazy-create-then-bump pattern handles the cold-start case: the
 * first ever view of a publication has no row yet, so the UPDATE returns
 * 0 rows; we then INSERT and retry the bump. A unique constraint on
 * {@code publication_id} keeps two concurrent first-bumps from creating
 * duplicate rows — the second loser catches the constraint violation and
 * just retries the UPDATE, which now succeeds.
 */
@Service
@RequiredArgsConstructor
@Slf4j
class MetricsService implements MetricsRecorder {

    private final PublicationMetricsRepository repository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordView(long publicationId) {
        try {
            bump(publicationId, Counter.VIEW);
        } catch (RuntimeException e) {
            // Never let a counter problem propagate to the page render.
            log.warn("Failed to record view for publication {}: {}",
                    publicationId, e.getMessage());
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordDownload(long publicationId, long galleyId) {
        try {
            bump(publicationId, Counter.DOWNLOAD);
        } catch (RuntimeException e) {
            log.warn("Failed to record download for publication {} galley {}: {}",
                    publicationId, galleyId, e.getMessage());
        }
    }

    private void bump(long publicationId, Counter counter) {
        Instant now = Instant.now();
        int updated = updateCounter(publicationId, counter, now);
        if (updated == 0) {
            ensureRowExists(publicationId);
            updated = updateCounter(publicationId, counter, now);
            if (updated == 0) {
                // Should be unreachable — the row exists by now. Log and move on.
                log.warn("Counter bump still 0 rows for publication {}", publicationId);
            }
        }
    }

    private int updateCounter(long publicationId, Counter counter, Instant now) {
        return switch (counter) {
            case VIEW -> repository.bumpViewCount(publicationId, now);
            case DOWNLOAD -> repository.bumpDownloadCount(publicationId, now);
        };
    }

    /**
     * Insert a zero-counter row for this publication if one doesn't exist
     * yet. A concurrent caller may win the race and trip the unique
     * constraint — that's fine, we swallow it and let the bump retry.
     */
    private void ensureRowExists(long publicationId) {
        if (repository.findByPublicationId(publicationId).isPresent()) {
            return;
        }
        try {
            PublicationMetrics row = new PublicationMetrics();
            row.setPublicationId(publicationId);
            repository.save(row);
        } catch (DataIntegrityViolationException race) {
            // Concurrent insert won — our retry will UPDATE the existing row.
            log.debug("Lost race to create metrics row for publication {}; retrying bump",
                    publicationId);
        }
    }

    private enum Counter { VIEW, DOWNLOAD }
}
