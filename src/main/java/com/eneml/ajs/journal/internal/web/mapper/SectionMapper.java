package com.eneml.ajs.journal.internal.web.mapper;

import com.eneml.ajs.journal.api.SectionSummary;
import com.eneml.ajs.journal.internal.domain.Section;
import com.eneml.ajs.journal.internal.web.dto.SectionCreateRequest;
import com.eneml.ajs.journal.internal.web.dto.SectionResponse;
import com.eneml.ajs.journal.internal.web.dto.SectionUpdateRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper
public interface SectionMapper {

    SectionResponse toResponse(Section entity);

    List<SectionResponse> toResponses(List<Section> entities);

    SectionSummary toSummary(Section entity);

    List<SectionSummary> toSummaries(List<Section> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "inactive", ignore = true)
    Section toEntity(SectionCreateRequest src);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "inactive", ignore = true)
    void updateEntity(SectionUpdateRequest src, @MappingTarget Section dst);
}
