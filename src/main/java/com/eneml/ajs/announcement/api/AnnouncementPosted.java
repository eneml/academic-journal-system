package com.eneml.ajs.announcement.api;

import java.time.Instant;

public record AnnouncementPosted(Long announcementId, AnnouncementType type, Instant occurredAt) {
    public static AnnouncementPosted of(Long id, AnnouncementType type) {
        return new AnnouncementPosted(id, type, Instant.now());
    }
}
