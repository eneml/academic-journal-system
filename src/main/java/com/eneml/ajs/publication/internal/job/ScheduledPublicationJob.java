package com.eneml.ajs.publication.internal.job;

import com.eneml.ajs.publication.internal.application.PublicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Promotes SCHEDULED publications to PUBLISHED once their target instant
 * has arrived. Runs at the top of every minute — fine granularity for
 * journal-scale workloads. The actual publish itself fires the
 * {@code PublicationPublished} event so listeners (CrossRef deposit,
 * search index, audit log, messaging) react as if a human pressed
 * "publish now".
 */
@Component
@RequiredArgsConstructor
@Slf4j
class ScheduledPublicationJob {

    private final PublicationService publications;

    @Scheduled(cron = "0 * * * * *")
    public void run() {
        int promoted = publications.promoteDueScheduled(Instant.now());
        if (promoted > 0) {
            log.info("auto-published {} scheduled publication(s)", promoted);
        }
    }
}
