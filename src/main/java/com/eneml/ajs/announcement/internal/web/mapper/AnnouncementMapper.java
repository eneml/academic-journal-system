package com.eneml.ajs.announcement.internal.web.mapper;

import com.eneml.ajs.announcement.api.AnnouncementSummary;
import com.eneml.ajs.announcement.internal.domain.Announcement;
import com.eneml.ajs.announcement.internal.web.dto.AnnouncementResponse;

import java.util.List;

public final class AnnouncementMapper {

    private AnnouncementMapper() {
    }

    public static AnnouncementResponse toResponse(Announcement entity) {
        return new AnnouncementResponse(
                entity.getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getBody(),
                entity.getUrlPath(),
                entity.getDatePosted(),
                entity.getDateExpires(),
                entity.isPinned(),
                entity.isVisible(),
                entity.getUpdatedAt());
    }

    public static List<AnnouncementResponse> toResponses(List<Announcement> entities) {
        return entities.stream().map(AnnouncementMapper::toResponse).toList();
    }

    public static AnnouncementSummary toSummary(Announcement entity) {
        return new AnnouncementSummary(
                entity.getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getBody(),
                entity.getUrlPath(),
                entity.getDatePosted(),
                entity.getDateExpires(),
                entity.isPinned(),
                entity.isVisible());
    }

    public static List<AnnouncementSummary> toSummaries(List<Announcement> entities) {
        return entities.stream().map(AnnouncementMapper::toSummary).toList();
    }
}
