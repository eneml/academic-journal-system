package com.eneml.ajs.publication.internal.web.mapper;

import com.eneml.ajs.publication.api.GalleySummary;
import com.eneml.ajs.publication.internal.domain.Galley;
import com.eneml.ajs.publication.internal.web.dto.GalleyResponse;
import com.eneml.ajs.publication.internal.web.dto.GalleyUpsertRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper
public interface GalleyMapper {

    GalleyResponse toResponse(Galley entity);

    List<GalleyResponse> toResponses(List<Galley> entities);

    GalleySummary toSummary(Galley entity);

    List<GalleySummary> toSummaries(List<Galley> entities);

    @Mapping(target = "id",            ignore = true)
    @Mapping(target = "publicationId", ignore = true)
    @Mapping(target = "approved",      ignore = true)
    @Mapping(target = "doiId",         ignore = true)
    @Mapping(target = "version",       ignore = true)
    @Mapping(target = "createdAt",     ignore = true)
    @Mapping(target = "updatedAt",     ignore = true)
    Galley toEntity(GalleyUpsertRequest src);

    @Mapping(target = "id",            ignore = true)
    @Mapping(target = "publicationId", ignore = true)
    @Mapping(target = "approved",      ignore = true)
    @Mapping(target = "doiId",         ignore = true)
    @Mapping(target = "version",       ignore = true)
    @Mapping(target = "createdAt",     ignore = true)
    @Mapping(target = "updatedAt",     ignore = true)
    void applyUpdate(GalleyUpsertRequest src, @MappingTarget Galley dst);
}
