package com.eneml.ajs.publication.internal.application;

import com.eneml.ajs.publication.internal.domain.Doi;
import com.eneml.ajs.publication.internal.persistence.DoiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Weekly sweep that flags REGISTERED DOIs whose underlying publication
 * has been edited after the last successful CrossRef deposit. Editors
 * see the STALE rows in the DOI manager and can trigger a re-deposit.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class DoiStaleSweep {

    private final DoiRepository doiRepository;

    @Scheduled(cron = "0 30 3 * * MON")
    @Transactional
    public void run() {
        Instant since = Instant.now().minus(365, ChronoUnit.DAYS);
        int marked = 0;
        for (Doi d : doiRepository.findRegisteredWithPublicationTouchedSince(since)) {
            d.markStale();
            marked++;
        }
        if (marked > 0) {
            log.info("doi-sweep: marked {} DOIs as STALE", marked);
        }
    }
}
