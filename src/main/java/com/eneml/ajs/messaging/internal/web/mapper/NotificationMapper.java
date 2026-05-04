package com.eneml.ajs.messaging.internal.web.mapper;

import com.eneml.ajs.messaging.api.NotificationSummary;
import com.eneml.ajs.messaging.internal.domain.Notification;
import com.eneml.ajs.messaging.internal.web.dto.NotificationResponse;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper
public interface NotificationMapper {

    NotificationResponse toResponse(Notification entity);

    List<NotificationResponse> toResponses(List<Notification> entities);

    NotificationSummary toSummary(Notification entity);

    List<NotificationSummary> toSummaries(List<Notification> entities);
}
