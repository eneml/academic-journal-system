package com.eneml.ajs.announcement.api;

import java.time.Instant;

public record AnnouncementWithdrawn(Long announcementId, Instant occurredAt) {
    public static AnnouncementWithdrawn of(Long id) {
        return new AnnouncementWithdrawn(id, Instant.now());
    }
}
