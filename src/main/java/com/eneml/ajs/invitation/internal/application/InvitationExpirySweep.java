package com.eneml.ajs.invitation.internal.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Daily sweep that flips PENDING invitations past their expiry into
 * EXPIRED. The link still 410s if anyone tries to use it; this just
 * keeps the admin list tidy and lets reporting filter on a clean
 * status.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class InvitationExpirySweep {

    private final InvitationService service;

    @Scheduled(cron = "0 15 4 * * *")
    public void run() {
        int expired = service.sweepExpired();
        if (expired > 0) {
            log.info("invitation-sweep: marked {} invitations as EXPIRED", expired);
        }
    }
}
