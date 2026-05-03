package com.eneml.ajs.journal.internal.web.mapper;

import com.eneml.ajs.journal.api.GenreSummary;
import com.eneml.ajs.journal.internal.domain.Genre;
import com.eneml.ajs.journal.internal.web.dto.GenreCreateRequest;
import com.eneml.ajs.journal.internal.web.dto.GenreResponse;
import com.eneml.ajs.journal.internal.web.dto.GenreUpdateRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper
public interface GenreMapper {

    GenreResponse toResponse(Genre entity);

    List<GenreResponse> toResponses(List<Genre> entities);

    GenreSummary toSummary(Genre entity);

    List<GenreSummary> toSummaries(List<Genre> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    Genre toEntity(GenreCreateRequest src);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    void updateEntity(GenreUpdateRequest src, @MappingTarget Genre dst);
}
