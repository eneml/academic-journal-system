package com.eneml.ajs.journal.internal.web.mapper;

import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.internal.domain.JournalConfig;
import com.eneml.ajs.journal.internal.web.dto.JournalConfigResponse;
import com.eneml.ajs.journal.internal.web.dto.JournalConfigUpdateRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper
public interface JournalConfigMapper {

    JournalConfigResponse toResponse(JournalConfig entity);

    JournalConfigSummary toSummary(JournalConfig entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    void updateEntity(JournalConfigUpdateRequest src, @MappingTarget JournalConfig dst);
}
