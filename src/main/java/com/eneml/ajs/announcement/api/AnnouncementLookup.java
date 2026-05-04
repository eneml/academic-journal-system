package com.eneml.ajs.announcement.api;

import java.time.Instant;
import java.util.List;

public interface AnnouncementLookup {

    List<AnnouncementSummary> listVisible(Instant now, int limit);

    List<AnnouncementSummary> listAll();
}
