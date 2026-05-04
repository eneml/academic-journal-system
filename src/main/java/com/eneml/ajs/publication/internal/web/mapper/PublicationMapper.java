package com.eneml.ajs.publication.internal.web.mapper;

import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.publication.internal.domain.Publication;
import com.eneml.ajs.publication.internal.web.dto.PublicationResponse;
import com.eneml.ajs.publication.internal.web.dto.PublicationUpsertRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper
public interface PublicationMapper {

    @Mapping(target = "version",    source = "versionNumber")
    @Mapping(target = "version_no", source = "version")
    PublicationResponse toResponse(Publication entity);

    List<PublicationResponse> toResponses(List<Publication> entities);

    @Mapping(target = "version", source = "versionNumber")
    PublicationSummary toSummary(Publication entity);

    List<PublicationSummary> toSummaries(List<Publication> entities);

    @Mapping(target = "id",                ignore = true)
    @Mapping(target = "submissionId",      ignore = true)
    @Mapping(target = "versionNumber",     ignore = true)
    @Mapping(target = "version",           ignore = true)
    @Mapping(target = "status",            ignore = true)
    @Mapping(target = "datePublished",     ignore = true)
    @Mapping(target = "doiId",             ignore = true)
    @Mapping(target = "createdAt",         ignore = true)
    @Mapping(target = "updatedAt",         ignore = true)
    void applyUpdate(PublicationUpsertRequest src, @MappingTarget Publication dst);
}
