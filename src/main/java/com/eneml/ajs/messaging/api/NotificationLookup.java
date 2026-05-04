package com.eneml.ajs.messaging.api;

import java.util.List;

public interface NotificationLookup {

    List<NotificationSummary> recentForUser(Long userId, int limit);

    long unreadCountForUser(Long userId);
}
