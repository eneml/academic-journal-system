package com.eneml.ajs.integration.internal.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Walks the deposit_record outbox once a minute. Each tick processes a
 * batch of PENDING records — failures are kept on the table with their
 * error message so an operator can investigate, and a future retry pass
 * can re-enqueue them.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class DepositDispatchJob {

    private static final int BATCH_SIZE = 25;

    private final DepositService depositService;

    @Scheduled(fixedDelayString = "${ajs.integration.dispatch-interval-ms:60000}",
               initialDelayString = "${ajs.integration.dispatch-initial-delay-ms:30000}")
    void tick() {
        int handled = depositService.dispatchPending(BATCH_SIZE);
        if (handled > 0) {
            log.info("dispatched {} pending deposit(s)", handled);
        }
    }
}
