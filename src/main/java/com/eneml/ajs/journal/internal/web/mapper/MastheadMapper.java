package com.eneml.ajs.journal.internal.web.mapper;

import com.eneml.ajs.journal.internal.domain.MastheadEntry;
import com.eneml.ajs.journal.internal.web.dto.MastheadEntryResponse;
import com.eneml.ajs.journal.internal.web.dto.MastheadEntryUpsertRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper
public interface MastheadMapper {

    @Mapping(target = "givenName",  ignore = true)
    @Mapping(target = "familyName", ignore = true)
    @Mapping(target = "orcidId",    ignore = true)
    MastheadEntryResponse toResponse(MastheadEntry entity);

    List<MastheadEntryResponse> toResponses(List<MastheadEntry> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    MastheadEntry toEntity(MastheadEntryUpsertRequest src);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    void updateEntity(MastheadEntryUpsertRequest src, @MappingTarget MastheadEntry dst);
}
